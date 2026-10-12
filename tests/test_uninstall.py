import os,shutil,subprocess,json
from pathlib import Path
import pytest

pytestmark=pytest.mark.skipif(os.name!='nt',reason='Windows uninstaller')
ROOT=Path(__file__).resolve().parents[1]

def fixture(tmp_path):
 root=tmp_path/'installation';(root/'tools').mkdir(parents=True)
 shutil.copyfile(ROOT/'tools/uninstall.ps1',root/'tools/uninstall.ps1')
 (root/'pyproject.toml').write_text('name = "kicad-parts-manager"')
 for folder in ['src','db','data','models','backups']:
  (root/folder).mkdir();(root/folder/'keep.txt').write_text('test')
 (root/'Start-KiCad-Parts-Manager.cmd').write_text('@echo off')
 return root

def run(root,answer='',busy=False,preview=False):
 path=str(root/'tools/uninstall.ps1').replace("'","''")
 processes="@([pscustomobject]@{ProcessId=123;Name='eeschema.exe';ExecutablePath='';CommandLine=''})" if busy else '@()'
 command=f"function Read-Host {{ '{answer}' }}; function Get-CimInstance {{ {processes} }}; & '{path}'"+(' -PreviewOnly' if preview else '')
 return subprocess.run(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-Command',command],capture_output=True,text=True,timeout=30)

def test_remove_program_preserves_data(tmp_path):
 root=fixture(tmp_path);result=run(root,'DEINSTALLIEREN')
 assert result.returncode==0,result.stderr
 assert not (root/'src').exists() and not (root/'tools').exists()
 for folder in ['db','data','models','backups']:assert (root/folder/'keep.txt').read_text()=='test'

def test_cancel_and_preview_preserve_program(tmp_path):
 root=fixture(tmp_path)
 assert run(root).returncode==0
 assert run(root,preview=True).returncode==0
 assert (root/'src/keep.txt').exists()

def test_running_kicad_blocks_removal(tmp_path):
 root=fixture(tmp_path);result=run(root,'DEINSTALLIEREN',busy=True)
 assert result.returncode!=0 and 'Please close KiCad' in result.stderr and (root/'src/keep.txt').exists()

def test_development_checkout_blocks_removal(tmp_path):
 root=fixture(tmp_path);(root/'.git').mkdir()
 result=run(root,'DEINSTALLIEREN')
 assert result.returncode!=0 and 'Development checkout' in result.stderr
 assert (root/'src/keep.txt').exists()

def test_user_library_in_program_directory_blocks_removal(tmp_path):
 root=fixture(tmp_path)
 (root/'db/user-import-settings.json').write_text(json.dumps(dict(folder=str(root/'src/UserLibrary'))))
 result=run(root,'DEINSTALLIEREN')
 assert result.returncode!=0 and 'User library inside program files' in result.stderr
 assert (root/'src/keep.txt').exists()
