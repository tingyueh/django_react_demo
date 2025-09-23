from django.contrib.auth.models import User

from rest_framework import viewsets, response, permissions

from .serializers import UserSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
import os


@api_view(['POST'])
@permission_classes((permissions.IsAuthenticated,))
def upload_file(request):
    """Simple endpoint to accept CSV or Excel uploads and save them to MEDIA_ROOT/uploads"""
    parser_classes = (MultiPartParser, FormParser)
    upload = request.FILES.get('file')
    if not upload:
        return response.Response({'error': 'no file uploaded'}, status=400)

    # Basic allowed extensions check
    name = upload.name
    ext = os.path.splitext(name)[1].lower()
    if ext not in ('.csv', '.xls', '.xlsx'):
        return response.Response({'error': 'unsupported file type'}, status=400)

    upload_dir = os.path.join(getattr(settings, 'MEDIA_ROOT', ''), 'uploads')
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    save_path = os.path.join(upload_dir, name)
    with open(save_path, 'wb') as out:
        for chunk in upload.chunks():
            out.write(chunk)

    return response.Response({'status': 'ok', 'filename': name})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def retrieve(self, request, pk=None):
        if pk == 'i':
            return response.Response(UserSerializer(request.user,
                context={'request':request}).data)
        return super(UserViewSet, self).retrieve(request, pk)
