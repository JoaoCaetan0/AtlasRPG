"""Validate new HTTP uploads without rewriting legacy assets."""
from io import BytesIO
from pathlib import PurePosixPath
import warnings
from PIL import Image,UnidentifiedImageError
from assets import MIMES
MAX_PIXELS=32_000_000

def validate_upload(name,body):
 if not isinstance(name,str) or not 1<=len(name)<200 or name in ('.','..') or any(ord(c)<32 or c in '/\\:' for c in name):raise ValueError('Nome de arquivo inválido.')
 ext=PurePosixPath(name).suffix.lower()
 if ext not in MIMES:raise ValueError('Formato não permitido.')
 if ext in ('.png','.jpg','.jpeg','.webp'):
  expected={'.png':'PNG','.jpg':'JPEG','.jpeg':'JPEG','.webp':'WEBP'}[ext]
  try:
   with warnings.catch_warnings():
    warnings.simplefilter('error',Image.DecompressionBombWarning)
    with Image.open(BytesIO(body)) as im:
     if im.format!=expected or im.width*im.height>MAX_PIXELS or getattr(im,'n_frames',1)!=1:raise ValueError('Use imagem estática de até 32 megapixels e extensão correspondente ao formato.')
     im.verify()
    with Image.open(BytesIO(body)) as im:im.load()
  except (UnidentifiedImageError,OSError,Image.DecompressionBombError,Image.DecompressionBombWarning) as e:raise ValueError('Imagem inválida, incompleta ou grande demais.') from e
 elif ext=='.pdf':
  if not body.startswith(b'%PDF-') or b'%%EOF' not in body[-2048:]:raise ValueError('PDF incompleto ou formato incorreto.')
 elif ext in ('.txt','.md'):
  try:body.decode('utf-8-sig')
  except UnicodeDecodeError as e:raise ValueError('Salve o texto como UTF-8.') from e
 elif ext=='.wav':
  if not (body.startswith(b'RIFF') and body[8:12]==b'WAVE'):raise ValueError('Formato WAV inválido.')
 elif ext=='.ogg':
  if not body.startswith(b'OggS'):raise ValueError('Formato OGG inválido.')
 elif ext=='.mp3':
  if not (body.startswith(b'ID3') or len(body)>1 and body[0]==255 and body[1]&224==224):raise ValueError('Formato MP3 inválido.')
