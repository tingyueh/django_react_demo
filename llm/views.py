from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import pandas as pd
from .services import RegexLLM
from .regex_safety import compile_safe, run_with_timeout

# 你已有上传接口的话，这里只读文件路径；若没有，可按你现有的 api 里读取
from django.conf import settings
from pathlib import Path

def _load_df_by_id(file_id: str) -> pd.DataFrame:
    # 简化：假设前面的上传接口把文件存成 <MEDIA_ROOT>/<file_id>.csv 或 .xlsx
    media = Path(getattr(settings, "MEDIA_ROOT", "media"))
    # 优先 csv
    csv_path = media / f"{file_id}.csv"
    xls_path = media / f"{file_id}.xlsx"
    if csv_path.exists():
        return pd.read_csv(csv_path)
    if xls_path.exists():
        return pd.read_excel(xls_path)
    raise FileNotFoundError("file not found")

class CompileRegexView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        nl = request.data.get("nl")
        file_id = request.data.get("file_id")
        sample_col = request.data.get("sample_col")
        if not nl:
            return Response({"error":"nl is required"}, status=400)

        samples = None
        if file_id and sample_col:
            try:
                df = _load_df_by_id(file_id)
                if sample_col in df.columns:
                    samples = df[sample_col].dropna().astype(str).head(20).tolist()
            except Exception:
                pass

        llm = RegexLLM()
        res = llm.nl_to_regex(nl, samples)
        # 先编译校验
        try:
            compile_safe(res["pattern"], res.get("flags", []))
        except Exception as e:
            return Response({"error": f"invalid pattern: {e}"}, status=400)
        return Response(res)

class PreviewTransformView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        file_id = request.data.get("file_id")
        pattern = request.data.get("pattern")
        flags = request.data.get("flags", [])
        replacement = request.data.get("replacement", "")
        columns = request.data.get("columns", [])  # 空=自动推断字符串列
        n = int(request.data.get("n", 20))

        if not (file_id and pattern):
            return Response({"error":"file_id & pattern required"}, status=400)

        df = _load_df_by_id(file_id)
        rx = compile_safe(pattern, flags)
        if not columns:
            columns = [c for c in df.columns if df[c].dtype == "object"]

        df_small = df.head(n).copy()
        hit_count = 0
        for c in columns:
            def do_sub(x):
                s = str(x)
                nonlocal hit_count
                hit_count += len(rx.findall(s))
                return rx.sub(replacement, s)
            df_small[c] = df_small[c].map(lambda x: run_with_timeout(lambda: do_sub(x), 1))

        return Response({
            "hit_count": int(hit_count),
            "columns": columns,
            "preview": df_small.to_dict(orient="records")
        })

class ApplyTransformView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        from django.core.files.storage import default_storage
        file_id = request.data.get("file_id")
        pattern = request.data.get("pattern")
        flags = request.data.get("flags", [])
        replacement = request.data.get("replacement", "")
        columns = request.data.get("columns", [])

        if not (file_id and pattern):
            return Response({"error":"file_id & pattern required"}, status=400)

        df = _load_df_by_id(file_id)
        rx = compile_safe(pattern, flags)
        if not columns:
            columns = [c for c in df.columns if df[c].dtype == "object"]

        for c in columns:
            df[c] = df[c].astype(str).map(lambda s: rx.sub(replacement, s))

        out_name = f"{file_id}_processed.csv"
        with default_storage.open(out_name, "w") as f:
            df.to_csv(f, index=False, encoding="utf-8")
        return Response({"processed_file": out_name, "download_url": f"/media/{out_name}"})
