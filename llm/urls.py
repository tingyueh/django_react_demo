from django.urls import path

from .views import CompileRegexView, PreviewTransformView, ApplyTransformView

urlpatterns = [
    path('llm/compile-regex/', CompileRegexView.as_view(), name='llm-compile-regex'),
    path('transform/preview/', PreviewTransformView.as_view(), name='llm-preview-transform'),
    path('transform/apply/', ApplyTransformView.as_view(), name='llm-apply-transform'),
]
