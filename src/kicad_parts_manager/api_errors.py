"""Stable language-independent error identities; original diagnostics retained."""
class ApiError(ValueError):
    def __init__(self,code,detail):
        super().__init__(detail)
        self.code=code


def error_payload(error):
    code=getattr(error,'code',None)
    if not code:
        code='file_error' if isinstance(error,OSError) else 'invalid_request' if isinstance(error,(ValueError,KeyError,TypeError)) else 'request_failed'
    return dict(error=str(error),code=code,details=str(error))
