# 负责把自然语言 -> 正则（可切换 OpenAI / 本地 vLLM OpenAI 兼容接口）
from typing import List, Dict, Any
import os, json, re, requests

SYSTEM_PROMPT = """You convert concise natural-language descriptions into safe, minimal, Python-compatible regex.
Return JSON: {"pattern": "...", "flags": [], "explanations": "..."}.
Avoid recursive/evil constructs; prefer tight, anchored patterns when possible.
"""

FEW_SHOTS = [
  {"nl": "find email addresses",
   "pattern": r"\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b", "flags": []},
  {"nl": "find 4-digit years between 1900 and 2099",
   "pattern": r"\\b(19\\d{2}|20\\d{2})\\b", "flags": []},
  {"nl": "find melbourne-style addresses with optional building names before the number and VIC postcode suffix",
   "pattern": r"^(?:[-A-Za-z0-9&'./ ]+\\s+)?\\d+(?:-\\d+)?\\s+[-A-Za-z0-9&'./ ]+\\s+[A-Z]+(?:\\s+[A-Z]+)*\\s+VIC\\s+\\d{4}$",
   "flags": ["MULTILINE"]},
  {"nl": "match addresses whose building name ends with Apartments or Hotel ahead of the street number",
   "pattern": r"^(?:[-A-Za-z0-9&'./ ]+(?:Apartments|Hotel)\\s+)?\\d+(?:-\\d+)?\\s+[-A-Za-z0-9&'./ ]+\\s+[A-Z]+(?:\\s+[A-Z]+)*\\s+VIC\\s+\\d{4}$",
   "flags": ["MULTILINE"]},
  {"nl": "detect campus addresses where phrases like Building 177 precede the street address ending with VIC and postcode",
   "pattern": r"^(?:[-A-Za-z0-9&'./ ]+Building\\s+\\d+\\s+)?\\d+(?:-\\d+)?\\s+[-A-Za-z0-9&'./ ]+\\s+[A-Z]+(?:\\s+[A-Z]+)*\\s+VIC\\s+\\d{4}$",
   "flags": ["MULTILINE"]},
  {"nl": "recognize victorian addresses whose suburb is multiple uppercase words like NORTH MELBOURNE or ROYAL PARK",
   "pattern": r"^(?:[-A-Za-z0-9&'./ ]+\\s+)?\\d+(?:-\\d+)?\\s+[-A-Za-z0-9&'./ ]+\\s+(?:[A-Z]+(?:\\s+[A-Z]+)*)\\s+VIC\\s+\\d{4}$",
   "flags": ["MULTILINE"]},
]

def build_user_prompt(nl_desc: str, samples: List[str] | None) -> str:
    demo = "\n".join([f'NL: {d["nl"]}\nREGEX: {d["pattern"]}\nFLAGS: {d["flags"]}' for d in FEW_SHOTS])
    samples_block = ""
    if samples:
        samples_block = "\nSAMPLES:\n" + "\n".join(samples[:10])
    return f"""{demo}
---
NL: {nl_desc}{samples_block}
Respond with one JSON object only.
"""

class RegexLLM:
    def __init__(self):
        # 两种方式择一：环境变量控制
        self.provider = os.getenv("LLM_PROVIDER", "openai")  # openai / vllm
        self.model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

    def nl_to_regex(self, nl_desc: str, sample_values: List[str] | None = None) -> Dict[str, Any]:
        payload = {
            "model": self.model,
            "messages": [
                {"role":"system","content":SYSTEM_PROMPT},
                {"role":"user","content":build_user_prompt(nl_desc, sample_values)}
            ],
            "temperature": 0
        }
        headers = {"Authorization": f"Bearer {self.api_key}"}
        r = requests.post(f"{self.base_url}/chat/completions", json=payload, headers=headers, timeout=60)
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"]
        content = self._extract_json_payload(content)
        try:
            data = json.loads(content)
            return {
                "pattern": data.get("pattern",""),
                "flags": data.get("flags", []),
                "explanations": data.get("explanations",""),
            }
        except Exception as e:
            raise ValueError(f"LLM returned non-JSON: {content[:200]}")

    def _extract_json_payload(self, text: str) -> str:
        """Strip markdown fences or prose around the JSON response."""
        if not text:
            return ""
        text = text.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return text
