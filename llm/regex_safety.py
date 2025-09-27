import re, signal

ALLOWED_FLAGS = {"IGNORECASE": re.IGNORECASE, "MULTILINE": re.MULTILINE}

class TimeoutError(Exception): pass

def run_with_timeout(fn, seconds=1):
    def handler(signum, frame): raise TimeoutError("regex timeout")
    signal.signal(signal.SIGALRM, handler)
    signal.alarm(seconds)
    try:
        return fn()
    finally:
        signal.alarm(0)

def compile_safe(pattern: str, flags: list[str]):
    if not isinstance(pattern, str) or not pattern:
        raise ValueError("empty pattern")
    # 简单黑名单，禁止递归/回溯炸弹构造
    banned = ["(?R", "(?P>", "(?0", "(?1", "(?2", "(?<=.*.*)"]  # 仅示例，可扩充
    if any(b in pattern for b in banned):
        raise ValueError("disallowed constructs")
    flg = 0
    for f in flags or []:
        if f in ALLOWED_FLAGS: flg |= ALLOWED_FLAGS[f]
    return re.compile(pattern, flg)
