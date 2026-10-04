from pathlib import Path
import re

p = Path('ai_service.py')
c = p.read_text(encoding='utf-8')

pattern = r'def generate_scene_voice\(.*?\n(?:    .*\n|\n)*?    return None\n'
c = re.sub(pattern, '', c, flags=re.DOTALL)

func = Path('voice_func_v2.txt').read_text(encoding='utf-8')
c = c.rstrip() + '\n\n\n' + func + '\n'

p.write_text(c, encoding='utf-8')
Path('voice_func_v2.txt').unlink()
print('OK - Voice function upgraded to ElevenLabs')
