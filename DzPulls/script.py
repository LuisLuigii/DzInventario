import re
import asyncio
import os
import time
import tempfile
import threading
import ctypes
import requests
import gspread
import win32gui
import win32con
from google.oauth2.service_account import Credentials
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from telethon import TelegramClient
from telethon.tl.functions.messages import GetBotCallbackAnswerRequest
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from gui import iniciar_gui, get_app, set_app
from dotenv import load_dotenv
# Buscar .env en la carpeta del exe primero, luego en el directorio actual
import sys as _sys
_env_path = os.path.join(os.path.dirname(_sys.executable), '.env') if getattr(_sys, 'frozen', False) else '.env'
load_dotenv(_env_path)
# ── SUPABASE LICENCIAS ──────────────────────────────────────────
SUPABASE_URL     = "https://svndmhkrrusfoyksazzt.supabase.co"
SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2bmRtaGtycnVzZm95a3Nhenp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc4ODM2MCwiZXhwIjoyMDk0MzY0MzYwfQ.1-BEXzYw-eSrzDz3Mpvalu-mB8BuV3JugpcXrnXaFSQ"

def obtener_hardware_id():
    import uuid as _uuid, hashlib as _hashlib, platform as _platform
    try:
        mac = ':'.join(['{:02x}'.format((_uuid.getnode() >> i) & 0xff) for i in range(0,48,8)][::-1])
        return _hashlib.sha256(f"{mac}-{_platform.processor()}".encode()).hexdigest()[:32]
    except:
        return _hashlib.sha256(_platform.node().encode()).hexdigest()[:32]

def verificar_licencia():
    import tkinter as tk
    from tkinter import messagebox
    hardware_id = obtener_hardware_id()
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/Licencias%20DzPulls?Hardware_id=eq.{hardware_id}&Activa=eq.true&select=*",
            headers=headers, timeout=10)
        if r.status_code == 200 and r.json():
            return True
    except: pass

    # Popup de activacion
    import sys as _sys2
    clave_resultado = [None]
    popup = tk.Tk()
    popup.title("DzPulls — Activacion")
    popup.geometry("420x280")
    popup.configure(bg="#0d1f1e")
    popup.resizable(False, False)
    popup.attributes("-topmost", True)
    try:
        for _base in [os.environ.get("NUITKA_ONEFILE_PARENT"),
                      os.path.dirname(os.path.realpath(_sys2.argv[0]))]:
            if _base:
                _ico = os.path.join(_base, "bmo-adventure.ico")
                if os.path.exists(_ico):
                    popup.iconbitmap(_ico)
                    break
    except: pass
    tk.Frame(popup, bg="#1ee3cf", height=4).pack(fill="x")
    tk.Frame(popup, bg="#0f1f1d", height=54).pack(fill="x")
    tk.Label(popup, text="◉  DzPulls — Activacion de Licencia",
        font=("Courier New", 12, "bold"), fg="#1ee3cf", bg="#0f1f1d").place(x=0, y=4, width=420, height=54)
    tk.Frame(popup, bg="#2a5a52", height=1).pack(fill="x")
    body = tk.Frame(popup, bg="#0d1f1e")
    body.pack(fill="both", expand=True, padx=30, pady=16)
    tk.Label(body, text="Ingresa tu clave de licencia",
        font=("Segoe UI", 11, "bold"), fg="#e8f8f5", bg="#0d1f1e").pack(anchor="w", pady=(0,4))
    tk.Label(body, text="Contacta al vendedor si no tienes una clave",
        font=("Segoe UI", 9), fg="#4a7c6f", bg="#0d1f1e").pack(anchor="w", pady=(0,12))
    clave_var = tk.StringVar()
    entry = tk.Entry(body, textvariable=clave_var, font=("Segoe UI", 14),
        bg="#122320", fg="#1ee3cf", insertbackground="#1ee3cf",
        relief="flat", justify="center", bd=0)
    entry.pack(fill="x", ipady=8, pady=(0,14))
    entry.focus_set()
    def confirmar(event=None):
        val = clave_var.get().strip()
        if val:
            clave_resultado[0] = val
            popup.destroy()
    entry.bind("<Return>", confirmar)
    tk.Button(body, text="Activar  →", font=("Segoe UI", 11, "bold"),
        bg="#3dd68c", fg="#0a1614", activebackground="#2ab872",
        relief="flat", bd=0, pady=9, cursor="hand2",
        command=confirmar).pack(fill="x")
    popup.mainloop()
    if not clave_resultado[0]:
        return False
    clave = clave_resultado[0]
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/Licencias%20DzPulls?Clave=eq.{clave}&Activa=eq.true&select=*",
            headers=headers, timeout=10)
        if r.status_code != 200 or not r.json():
            root2 = tk.Tk(); root2.withdraw()
            messagebox.showerror("Error", f"Licencia invalida. ({r.status_code}: {r.text[:50]})")
            root2.destroy(); return False
        data = r.json()[0]
        if data.get("Hardware_id") and data["Hardware_id"] != hardware_id:
            root2 = tk.Tk(); root2.withdraw()
            messagebox.showerror("Error", "Esta licencia ya esta activada en otra PC.")
            root2.destroy(); return False
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/Licencias%20DzPulls?Clave=eq.{clave}",
            headers={**headers, "Prefer": "return=minimal"}, json={"Hardware_id": hardware_id}, timeout=10)
        return True
    except Exception as e:
        root2 = tk.Tk(); root2.withdraw()
        messagebox.showerror("Error", f"No se pudo verificar:\n{e}")
        root2.destroy(); return False

# ── CONFIGURACION ───────────────────────────────────────────────
api_id       = int(os.getenv("TELEGRAM_API_ID", "36692484"))
api_hash     = os.getenv("TELEGRAM_API_HASH", "a7f821809839c519ea4874cf0c8aa2ae")
bot_username = os.getenv("TELEGRAM_BOT", "goggww_bot")
# Base dir para Nuitka onefile
import sys as _sys
# Obtener ruta real del exe usando Windows API
try:
    import ctypes as _ctypes
    _buf = _ctypes.create_unicode_buffer(32768)
    _ctypes.windll.kernel32.GetModuleFileNameW(0, _buf, 32768)
    _BASE_DIR = os.path.dirname(_buf.value)
except:
    _BASE_DIR = os.path.dirname(os.path.abspath(_sys.argv[0]))

# Carpetas
CARPETA_ENTRADAS = os.getenv("CARPETA_ENTRADAS", "entradas")
CARPETA_DATOS    = os.getenv("CARPETA_DATOS",    "datos")
os.makedirs(os.path.join(_BASE_DIR, CARPETA_ENTRADAS), exist_ok=True)
os.makedirs(os.path.join(_BASE_DIR, CARPETA_DATOS),    exist_ok=True)

# Archivos de entrada
archivo_txt   = os.path.join(_BASE_DIR, CARPETA_ENTRADAS, os.getenv("ARCHIVO_CORREOS", "correos.txt"))
archivo_fresh = os.path.join(_BASE_DIR, CARPETA_ENTRADAS, os.getenv("ARCHIVO_FRESH",   "fresh.txt"))

# Archivos de datos
archivo_resultados  = os.path.join(_BASE_DIR, CARPETA_DATOS, os.getenv("ARCHIVO_RESULTADOS", "resultados_finales.txt"))
archivo_completados = os.path.join(_BASE_DIR, CARPETA_DATOS, os.getenv("ARCHIVO_COMPLETADOS","recoveries_completados.txt"))
archivo_screach     = os.path.join(_BASE_DIR, CARPETA_DATOS, os.getenv("ARCHIVO_SCREACH",    "screach_procesados.txt"))
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
EPIC_LOGIN_URL = "https://www.epicgames.com/id/login"
def get_epic_url(pais=None):
    return EPIC_LOGIN_URL
ADSPOWER_API   = "http://local.adspower.net:50325"
PUERTO_FORWARD = int(os.getenv("PUERTO_FORWARD", "60003"))
CREDENCIALES_JSON    = "credenciales.json"
GEOLOCATION_API_KEY  = os.getenv("GEOLOCATION_API_KEY", "238485DA28205533B12AFAC293EEAC97")
archivo_lineas_fresh = os.path.join(_BASE_DIR, CARPETA_DATOS, os.getenv("ARCHIVO_LINEAS_FRESH", "lineas_con_fresh.txt"))
GOOGLE_SHEET_URL  = "https://docs.google.com/spreadsheets/d/1NI7Zk7xNF3Js5p7nyYSevfPOhEzrEntw7Xly4pjY_jU/edit"
GOOGLE_SHEET_TAB  = os.getenv("GOOGLE_SHEET_TAB", "PULLS LUIGGII")
TIPO_CUENTA       = os.getenv("TIPO_CUENTA", "FLOSS")
INVENTARIO_API_URL = os.getenv("INVENTARIO_API_URL", "https://dzinventario.online/api/pulls")
INVENTARIO_API_KEY = os.getenv("INVENTARIO_API_KEY", "")
SELLER_NAME        = os.getenv("SELLER_NAME", "Luigii")
BASURA = {
    'scentbird','user','adobe','microsoft','leakbase','database',
    'collection','breach','foro','email','correo','null','none',
    'unknown','admin','test','na','n/a','new member','male',
    'female','vindicia','no name','noname','consumer',
    'not available','notavailable','anonymous','anon','guest',
    'customer','member','account','profile',
    'deezer','canva','spotify','netflix','linkedin','twitter',
    'facebook','instagram','snapchat','tiktok','twitch','discord',
    'steam','epic','epicgames','riot','roblox','minecraft',
    'playstation','xbox','nintendo','apple','google','yahoo',
    'hotmail','outlook','gmail','dropbox','lastpass','myspace',
    'tumblr','reddit','quora','pinterest','shein','zalando',
    'rockyou','exploit','combo','list','paste','dump','leak',
    'root','rootosint','osint','bot','lookup','search',
}
import random as _random
import datetime as _datetime
# ── Fechas por ítem (orden de antigüedad) ───────────────────────────
_ITEMS_US = [
    ("fresh",          (2017,12,16), (2017,12,19)),
    ("floss",          (2017,12,20), (2017,12,28)),
    ("the reaper",     (2018, 2,22), (2018, 2,25)),
    ("take the l",     (2018, 2,26), (2018, 2,28)),
    ("save the world", (2018, 3, 1), (2018, 5,31)),
]
_ITEMS_UK = [
    ("fresh",          (2017,12,16), (2017,12,19)),
    ("floss",          (2017,12,20), (2017,12,28)),
    ("the reaper",     (2018, 2,22), (2018, 2,25)),
    ("take the l",     (2018, 2,26), (2018, 2,28)),
    ("save the world", (2018, 3, 1), (2018, 5,31)),
]
def calcular_fecha_xbox(emotes_str, cosmeticos, pais):
    es_uk = bool(pais) and pais.strip().lower() in (
        "united kingdom","uk","england","scotland","wales","northern ireland")
    fmt   = "%d/%m/%Y" if es_uk else "%m/%d/%Y"
    tabla = _ITEMS_UK if es_uk else _ITEMS_US

    texto = " ".join([
        (emotes_str or ""),
        (cosmeticos.get("characters", "") or ""),
        (cosmeticos.get("pickaxes",   "") or ""),
        (cosmeticos.get("backblings", "") or ""),
    ]).lower()

    # Buscar la fecha mas antigua entre los cosmeticos
    for item, ini, fin in tabla:
        patron = r'(?<!windmill )' + re.escape(item) + r'(?!\w)' if item == 'floss' else r'(?<!\w)' + re.escape(item) + r'(?!\w)'
        if re.search(patron, texto):
            d1   = _datetime.date(*ini)
            d2   = _datetime.date(*fin)
            rand = d1 + _datetime.timedelta(days=_random.randint(0, (d2-d1).days))
            return rand.strftime(fmt)

    # Si no hay cosmeticos antiguos pero tiene STW: mayo 2018
    if cosmeticos.get("stw", "no").strip().lower() == "yes":
        d1   = _datetime.date(2018, 5, 1)
        d2   = _datetime.date(2018, 5, 15)
        rand = d1 + _datetime.timedelta(days=_random.randint(0, (d2-d1).days))
        return rand.strftime(fmt)

    return None


# ── Login Telegram con GUI ──────────────────────────────────────
def mostrar_popup_telegram(fase="phone", phone=""):
    """Pide al hilo principal que muestre el popup de Telegram."""
    # Import local para no crashear el exe si telegram_popup tiene algun error
    try:
        import telegram_popup as _tp  # noqa
    except Exception as e:
        gui_log(f"Error cargando telegram_popup: {e}", "error")
        return None
    app = get_app()
    if not app: return None
    app.respuesta_var.set("")
    app.queue.put({"tipo": "telegram_popup", "fase": fase, "phone": phone})
    while True:
        val = app.respuesta_var.get()
        if val:
            app.respuesta_var.set("")
            return val if val != "CANCELAR" else None
        time.sleep(0.05)

async def login_telegram_gui():
    """Realiza el login de Telegram usando popup en hilo principal."""
    from telethon.errors import (SessionPasswordNeededError,
        PhoneNumberInvalidError, PhoneCodeInvalidError,
        PhoneCodeExpiredError, FloodWaitError)

    gui_log("Iniciando login de Telegram...", "info")

    # Fase 1: pedir telefono
    phone = mostrar_popup_telegram("phone")
    if not phone:
        gui_log("Login cancelado.", "warning")
        return False

    gui_log(f"Enviando codigo a {phone}...", "info")
    try:
        client = TelegramClient(os.path.join(_BASE_DIR, 'sesion_actualizada'), api_id, api_hash)
        await client.connect()
        sent = await client.send_code_request(phone)
        gui_log("Codigo enviado — revisa tu Telegram.", "success")
    except PhoneNumberInvalidError:
        gui_log("Error: numero de telefono invalido.", "error")
        return False
    except FloodWaitError as e:
        gui_log(f"Error: demasiados intentos, espera {e.seconds}s.", "error")
        return False
    except Exception as e:
        gui_log(f"Error enviando codigo: {e}", "error")
        return False

    # Fase 2: pedir codigo
    code = mostrar_popup_telegram("code", phone)
    if not code:
        await client.disconnect()
        gui_log("Login cancelado.", "warning")
        return False

    try:
        await client.sign_in(phone, code, phone_code_hash=sent.phone_code_hash)
        await client.disconnect()
        gui_log("Telegram sesion guardada correctamente ✓", "success")
        return True
    except PhoneCodeInvalidError:
        gui_log("Error: codigo incorrecto.", "error")
        await client.disconnect()
        return False
    except PhoneCodeExpiredError:
        gui_log("Error: el codigo expiro, vuelve a intentarlo.", "error")
        await client.disconnect()
        return False
    except SessionPasswordNeededError:
        gui_log("Error: esta cuenta tiene 2FA activado — no soportado.", "error")
        await client.disconnect()
        return False
    except Exception as e:
        gui_log(f"Error al verificar codigo: {e}", "error")
        await client.disconnect()
        return False

# ── Cola de correos nuevos (para Recargar) ─────────────────────────
import queue as _queue
_cola_nuevos = _queue.Queue()
_cola_raw    = _queue.Queue()  # correos sin procesar para screach
# ── GUI helpers ─────────────────────────────────────────────────
def gui_log(msg, tag=""):
    app = get_app()
    if app:
        app.queue.put({"tipo": "log", "texto": msg, "tag": tag})
def gui_status(msg, color="#3dd68c"):
    app = get_app()
    if app:
        app.queue.put({"tipo": "status", "texto": msg, "color": color})
def gui_progress(current, total):
    app = get_app()
    if app:
        app.queue.put({"tipo": "progress", "current": current, "total": total})
def gui_datos(datos):
    app = get_app()
    if app:
        app.queue.put({"tipo": "datos", "datos": datos})
def gui_freshs(cantidad):
    app = get_app()
    if app:
        app.queue.put({"tipo": "freshs", "cantidad": cantidad})
def esperar_proxy_con_deshacer():
    app = get_app()
    if not app:
        return "ENTER"
    app.deshacer_pendiente = False
    app.queue.put({"tipo": "enable_buttons", "mode": "proxy"})
    app.respuesta_var.set("")
    while True:
        if getattr(app, "deshacer_pendiente", False):
            app.deshacer_pendiente = False
            return "DESHACER"
        val = app.respuesta_var.get()
        if val:
            app.respuesta_var.set("")
            return val
        time.sleep(0.05)
def esperar_respuesta(mode="proxy"):
    app = get_app()
    if not app:
        return "ENTER"
    app.queue.put({"tipo": "enable_buttons", "mode": mode})
    app.respuesta_var.set("")
    while True:
        val = app.respuesta_var.get()
        if val:
            return val
        time.sleep(0.05)
# ── Archivos ────────────────────────────────────────────────────
def borrar_fresh_usado(fresh_correo):
    try:
        with open(archivo_fresh, "r", encoding="utf-8") as f:
            lineas = f.readlines()
        with open(archivo_fresh, "w", encoding="utf-8") as f:
            f.writelines([l for l in lineas if not l.strip().startswith(fresh_correo)])
        gui_log(f"Fresh borrado: {fresh_correo}", "muted")
    except Exception as e:
        gui_log(f"Error borrando fresh: {e}", "error")
def enviar_a_inventario(account_id, mail_pulleado, fresh_correo, fresh_pass):
    if not INVENTARIO_API_KEY:
        return
    try:
        fecha_inicial = datetime.now()
        fecha_final   = fecha_inicial + timedelta(days=2)
        fresh_colocado = f"{fresh_correo}:{fresh_pass}" if fresh_correo and fresh_pass else (fresh_correo or "")
        payload = {
            "id_cuenta": account_id,
            "tipo_cuenta": TIPO_CUENTA,
            "fresh_colocado": fresh_colocado,
            "mail_pulleado": mail_pulleado or "",
            "seller": SELLER_NAME,
            "fecha_inicial": fecha_inicial.strftime("%Y-%m-%d"),
            "fecha_final":   fecha_final.strftime("%Y-%m-%d"),
        }
        headers = {
            "Authorization": f"Bearer {INVENTARIO_API_KEY}",
            "Content-Type": "application/json",
        }
        resp = requests.post(INVENTARIO_API_URL, json=payload, headers=headers, timeout=10)
        if resp.status_code == 200:
            gui_log("✅ Registrado en DzInventario", "success")
        else:
            gui_log(f"⚠ DzInventario: {resp.status_code} — {resp.text[:80]}", "warning")
    except Exception as e:
        gui_log(f"⚠ Error enviando a DzInventario: {e}", "warning")

def marcar_recovery_completado(correo):
    try:
        with open(archivo_completados, "a", encoding="utf-8") as f:
            f.write(correo + "\n")
    except:
        pass
def cargar_recoveries_completados():
    s = set()
    if os.path.exists(archivo_completados):
        with open(archivo_completados, "r", encoding="utf-8") as f:
            for l in f:
                l = l.strip()
                if l: s.add(l)
    return s
def marcar_screach_procesado(correo):
    try:
        with open(archivo_screach, "a", encoding="utf-8") as f:
            f.write(correo + "\n")
    except:
        pass
def cargar_screach_procesados():
    s = set()
    if os.path.exists(archivo_screach):
        with open(archivo_screach, "r", encoding="utf-8") as f:
            for l in f:
                l = l.strip()
                if l: s.add(l)
    return s
def obtener_linea_completa_correo(texto, correo):
    for linea in texto.split("\n"):
        if correo in linea:
            return linea.strip()
    return ""
def extraer_cosmeticos(texto, correo):
    for linea in texto.split("\n"):
        if correo in linea:
            char_match  = re.search(r'Characters?:\s*([^\|]+)', linea)
            pick_match  = re.search(r'Pickaxes?:\s*([^\|]+)',   linea)
            back_match  = re.search(r'Backblings?:\s*([^\|]+)', linea)
            emote_match = re.search(r'Emotes?:\s*([^\|]+)',     linea)
            stw_match   = re.search(r'STW:\s*(Yes|No)', linea, re.IGNORECASE)
            return {
                'characters': char_match.group(1).strip()         if char_match  else "",
                'pickaxes'  : pick_match.group(1).strip()         if pick_match  else "",
                'backblings': back_match.group(1).strip()         if back_match  else "",
                'emotes'    : emote_match.group(1).strip()        if emote_match else "",
                'stw'       : stw_match.group(1).strip().lower()  if stw_match   else "no",
            }
    return {'characters': "", 'pickaxes': "", 'backblings': "", 'emotes': "", 'stw': "no"}
def guardar_en_txt(correo, account_id, username, xbl, psn, nombres, ip, pais, region, ciudad, zip_code):
    try:
        if not os.path.exists(archivo_resultados):
            with open(archivo_resultados, "w", encoding="utf-8") as f:
                f.write("Correo OG|||AccountId|||Username|||Xbox|||PSN|||Nombres|||IP|||Pais|||Region|||Ciudad|||ZIP\n")
                f.write("-" * 100 + "\n")
        nombres_str = ", ".join(nombres) if nombres else "No encontrado"
        with open(archivo_resultados, "a", encoding="utf-8") as f:
            f.write(f"{correo}|||{account_id}|||{username}|||{xbl}|||{psn}|||{nombres_str}|||{ip}|||{pais}|||{region}|||{ciudad}|||{zip_code}\n")
    except Exception as e:
        gui_log(f"Error txt: {e}", "error")
def leer_datos_del_txt(correo):
    if not os.path.exists(archivo_resultados):
        return None
    with open(archivo_resultados, "r", encoding="utf-8") as f:
        for linea in f.readlines()[2:]:
            linea = linea.strip()
            if not linea: continue
            partes = linea.split("|||")
            if len(partes) >= 11 and partes[0] == correo:
                return {
                    'correo'    : partes[0],
                    'account_id': partes[1],
                    'username'  : partes[2],
                    'xbl'       : partes[3],
                    'psn'       : partes[4],
                    'nombres'   : partes[5].split(", "),
                    'ip'        : partes[6],
                    'pais'      : partes[7],
                    'region'    : partes[8],
                    'ciudad'    : partes[9],
                    'zip_code'  : partes[10].strip(),
                }
    return None
def extraer_datos_correo(texto, correo):
    for linea in texto.split("\n"):
        if correo in linea:
            account_match  = re.search(r'AccountId:\s*([a-f0-9]+)', linea)
            username_match = re.search(r'Username:\s*([^\|]+)', linea)
            xbl_match      = re.search(r'xbl,(?:\s*xuid:[^,]+,)?\s*DisplayName:\s*([^,\)]+)', linea)
            psn_match      = re.search(r'psn,(?:\s*psn_user_id:[^,]+,)?\s*DisplayName:\s*([^,\)]+)', linea)
            return {
                'account_id': account_match.group(1).strip()  if account_match  else "",
                'username'  : username_match.group(1).strip() if username_match else "",
                'xbl'       : xbl_match.group(1).strip()      if xbl_match      else "NO",
                'psn'       : psn_match.group(1).strip()      if psn_match      else "NO",
            }
    return {'account_id': "", 'username': "", 'xbl': "NO", 'psn': "NO"}
def extraer_correos_con_ip(texto):
    resultado = {}
    for linea in texto.split("\n"):
        linea = linea.strip()
        if not linea: continue
        m = re.match(r'([\w\.-]+@[\w\.-]+\.\w+)', linea)
        if not m: continue
        correo = m.group(1)
        ip_m = re.search(r'IP:\s*([\d\.]+)', linea)
        resultado[correo] = ip_m.group(1) if ip_m else None
    return resultado
# ── Helpers de nombres ───────────────────────────────────────────
def limpiar_linea(linea):
    return re.sub(r'[^\w\s\.\-:áéíóúÁÉÍÓÚñÑüÜ]', '', linea).strip()
def separar_nombre_pegado(valor):
    valor = re.sub(r'\d+$', '', valor).strip()
    valor = re.sub(r'^\d+', '', valor).strip()
    if not valor: return ""
    if re.search(r'[_\.\-]', valor):
        partes = re.split(r'[_\.\-]', valor)
        partes = [p.strip().title() for p in partes if len(p) > 1]
        if len(partes) >= 2:
            return " ".join(partes[:2])
    camel = re.sub(r'([a-z])([A-Z])', r'\1 \2', valor)
    if camel != valor:
        partes = [p.title() for p in camel.split() if len(p) > 1]
        # Filtrar palabras que parecen gamertags
        partes = [p for p in partes if p.lower() not in PALABRAS_GAMERTAG]
        if len(partes) >= 2:
            return " ".join(partes[:2])
    return valor.title()
PALABRAS_GAMERTAG = {
    'itz','its','xd','xx','gg','btw','aka','the','pro','god',
    'og','pvp','ez','lol','omg','wtf','efc','fc','tv','yt',
    'irl','rip','ngl','tbh','npc','bot','vip','ace','king',
    'queen','lord','sir','mr','ms','mrs','dr','xl','xo',
    'killer','sniper','ninja','gamer','noob','elite','clan',
    'over','under','bombs','jersey','real','true','dark',
    'blue','red','green','black','white','shadow','ghost',
    'fire','ice','storm','legend','hero','wolf','bear','fox',
    'crazy','cool','best','last','first','only','free',
}
def es_nombre_completo_valido(valor):
    if not valor or len(valor.strip()) < 4: return False
    partes = valor.strip().split()
    if len(partes) < 2: return False
    if valor.lower().strip() in BASURA: return False
    if valor.replace(" ", "").isdigit(): return False
    if '@' in valor or 'http' in valor: return False
    if re.search(r'\d{3,}', valor): return False
    for p in partes:
        if len(re.sub(r'\d', '', p)) < 2: return False
    return True
def es_valor_valido(valor):
    if not valor or len(valor.strip()) < 2: return False
    if valor.lower().strip() in BASURA: return False
    if valor.replace(" ", "").isdigit(): return False
    if '@' in valor or 'http' in valor: return False
    if re.search(r'\d{4,}', valor): return False
    return True
def nombre_desde_correo(correo):
    try:
        usuario = correo.split("@")[0]
        if re.search(r'[\._\-]', usuario):
            partes = re.split(r'[\._\-]', usuario)
            partes = [re.sub(r'\d+$', '', p) for p in partes]
            partes = [re.sub(r'^\d+', '', p) for p in partes]
            partes = [p for p in partes if len(p) > 1 and not p.isdigit()]
            if len(partes) >= 2:
                nombre = " ".join([p.title() for p in partes[:2]])
                if es_nombre_completo_valido(nombre):
                    return nombre
        else:
            nombre_groq = extraer_nombre_desde_correo_con_groq(usuario)
            if nombre_groq:
                return nombre_groq
    except:
        pass
    return None
def extraer_nombre_desde_correo_con_groq(usuario_correo):
    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": f"This is an email username: {usuario_correo}. Split it into a real person first name and last name. Reply ONLY with FirstName LastName. If not a real name reply NO."}], "max_tokens": 20, "temperature": 0.1},
            timeout=10
        )
        if r.status_code == 200:
            respuesta = r.json()['choices'][0]['message']['content'].strip()
            gui_log(f"    Groq raw: {respuesta}", "muted")
            respuesta = re.sub(r'[^\w\s\.\-]', '', respuesta).strip()
            if respuesta and respuesta.upper() != "NO" and es_nombre_completo_valido(respuesta):
                return respuesta.title()
        else:
            gui_log(f"    Groq status: {r.status_code} — {r.text[:100]}", "error")
        return None
    except Exception as e:
        gui_log(f"    Groq excepcion: {e}", "error")
        return None
def limpiar_texto_para_groq(texto):
    try:
        lineas = []
        palabras_clave = ['nombre', 'name', 'apellido', 'surname', 'mella', 'nick', 'full']
        for linea in texto.split("\n"):
            linea_ascii = linea.encode('ascii', errors='ignore').decode('ascii')
            linea_ascii = re.sub(r'[^\w\s\:\-\.]', ' ', linea_ascii)
            linea_ascii = re.sub(r'\s+', ' ', linea_ascii).strip()
            if linea_ascii and len(linea_ascii) > 3:
                if any(p in linea.lower() for p in palabras_clave):
                    lineas.append(linea_ascii)
        return "\n".join(lineas[:15])[:600] if lineas else ""
    except:
        return ""
def extraer_nombre_con_groq(texto):
    try:
        texto_limpio = limpiar_texto_para_groq(texto)
        if not texto_limpio:
            return []
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": "llama-3.3-70b-versatile", "messages": [{"role": "system", "content": "Find a real person full name in the text. Reply ONLY with FirstName LastName or NO."}, {"role": "user", "content": texto_limpio}], "max_tokens": 20, "temperature": 0.1},
            timeout=10
        )
        if r.status_code == 200:
            respuesta = r.json()['choices'][0]['message']['content'].strip()
            respuesta = re.sub(r'[^\w\s\.\-]', '', respuesta).strip()
            if respuesta and respuesta.upper() != "NO" and es_nombre_completo_valido(respuesta):
                return [respuesta.title()]
        return []
    except:
        return []
def nombre_fallback_correo(correo):
    try:
        usuario = correo.split("@")[0]
        usuario = re.sub(r'\d+$', '', usuario)
        usuario = re.sub(r'^\d+', '', usuario)
        if re.search(r'[\.\-_]', usuario):
            partes = re.split(r'[\.\-_]', usuario)
            partes = [re.sub(r'\d+$', '', p).strip() for p in partes]
            partes = [p for p in partes if len(p) > 1 and not p.isdigit()]
            if len(partes) >= 2:
                return " ".join(p.title() for p in partes[:2])
            elif partes:
                return partes[0].title()
        return usuario.title() if len(usuario) > 2 else None
    except:
        return None
def usuario_del_correo(correo):
    return correo.split("@")[0].lower()
def extraer_todos_los_nombres(texto_completo, correo):
    usuario = usuario_del_correo(correo)
    ETIQUETAS_COMPLETO = ['nombre completo', 'full name', 'fullname', 'real name', 'full_name']
    ETIQUETAS_NOMBRE   = ['nombre', 'first name', 'firstname', 'fname', 'first_name', 'given name', 'givenname', 'primer nombre', 'name']
    ETIQUETAS_APELLIDO = ['apellido', 'last name', 'lastname', 'lname', 'last_name', 'surname', 'family name']
    ETIQUETAS_MELLA    = ['mella', 'nick', 'nickname', 'alias', 'apodo']
    completos = []
    nombres   = []
    apellidos = []
    for linea in texto_completo.split("\n"):
        lc = limpiar_linea(linea)
        if ":" not in lc: continue
        partes = lc.split(":", 1)
        if len(partes) < 2: continue
        etiqueta = partes[0].strip().lower()
        valor    = re.sub(r'\d+$', '', partes[1].strip()).strip()
        valor    = re.sub(r'[^\w\s\.\-áéíóúÁÉÍÓÚñÑüÜ]', '', valor).strip()
        if not valor or len(valor) < 2 or valor.isdigit(): continue
        if any(k in etiqueta for k in ETIQUETAS_COMPLETO):
            v = separar_nombre_pegado(valor) if ' ' not in valor else valor.title()
            if es_nombre_completo_valido(v): completos.append(v)
        elif any(k in etiqueta for k in ETIQUETAS_NOMBRE):
            v = valor.title()
            if es_valor_valido(v): nombres.append(v)
        elif any(k in etiqueta for k in ETIQUETAS_APELLIDO):
            v = valor.title()
            if es_valor_valido(v): apellidos.append(v)
        elif any(k in etiqueta for k in ETIQUETAS_MELLA):
            # Ignorar si el valor original contiene @ o http (email/url en mella)
            valor_raw = partes[1].strip() if len(partes) > 1 else ""
            if '@' in valor_raw or 'http' in valor_raw.lower(): continue
            v = separar_nombre_pegado(valor)
            if es_nombre_completo_valido(v): completos.append(v)
    candidatos = list(completos)
    if nombres and apellidos:
        for n in nombres:
            for a in apellidos:
                if n.upper() != a.upper():
                    combo = f"{n} {a}"
                    if es_nombre_completo_valido(combo): candidatos.append(combo)
    if not candidatos:
        todas = ETIQUETAS_COMPLETO + ETIQUETAS_NOMBRE + ETIQUETAS_APELLIDO + ETIQUETAS_MELLA
        for linea in texto_completo.split("\n"):
            lc = limpiar_linea(linea)
            if ":" not in lc: continue
            partes = lc.split(":", 1)
            if len(partes) < 2: continue
            etiqueta = partes[0].strip().lower()
            valor    = re.sub(r'\d+$', '', partes[1].strip()).strip()
            valor    = re.sub(r'[^\w\s\.\-áéíóúÁÉÍÓÚñÑüÜ]', '', valor).strip()
            if not valor or len(valor) < 4 or valor.isdigit(): continue
            if any(k in etiqueta for k in todas):
                v = separar_nombre_pegado(valor)
                if es_nombre_completo_valido(v): candidatos.append(v)
    if not candidatos:
        usuario_raw = correo.split("@")[0]
        if re.search(r'[\._\-]', usuario_raw):
            partes = re.split(r'[\._\-]', usuario_raw)
            partes = [re.sub(r'\d+$', '', p) for p in partes]
            partes = [p for p in partes if len(p) > 1 and not p.isdigit()]
            if len(partes) >= 2:
                nombre = " ".join([p.title() for p in partes[:2]])
                if es_nombre_completo_valido(nombre):
                    candidatos = [nombre]
                    gui_log(f"    Nombre del correo: {nombre}", "muted")
    if not candidatos:
        nombres_groq = extraer_nombre_con_groq(texto_completo)
        if nombres_groq:
            candidatos = nombres_groq
            gui_log(f"    Groq screach: {nombres_groq}", "success")
    if not candidatos:
        usuario_raw = correo.split("@")[0]
        usuario_raw = re.sub(r'\d+$', '', usuario_raw)
        gui_log(f"    Intentando Groq con correo: {usuario_raw}", "muted")
        nombre_groq = extraer_nombre_desde_correo_con_groq(usuario_raw)
        gui_log(f"    Groq respuesta: {nombre_groq}", "muted")
        if nombre_groq:
            candidatos = [nombre_groq]
            gui_log(f"    Groq correo: {nombre_groq}", "success")
    if not candidatos:
        nombre_correo = nombre_fallback_correo(correo)
        if nombre_correo and es_nombre_completo_valido(nombre_correo):
            gui_log(f"    Fallback correo: {nombre_correo}", "muted")
            return [nombre_correo], nombre_correo
        return [], "No encontrado"
    vistos = set()
    unicos = []
    for c in candidatos:
        if c.lower() not in vistos:
            vistos.add(c.lower())
            unicos.append(c)
    def coincide(nombre):
        for parte in nombre.lower().split():
            if len(parte) > 2 and parte in usuario: return True
        n = nombre.lower().replace(" ", "")
        return n in usuario or usuario in n
    ordenados = [c for c in unicos if coincide(c)] + [c for c in unicos if not coincide(c)]
    return ordenados, ordenados[0] if ordenados else "No encontrado"
# ── Geo ──────────────────────────────────────────────────────────
def _geo_ipapi(ip):
    r = requests.get(f"http://ip-api.com/json/{ip}", timeout=5)
    d = r.json()
    if d.get("status") == "success":
        return d.get("country",""), d.get("regionName",""), d.get("city",""), d.get("zip","")
    return None
def _geo_ipwho(ip):
    r = requests.get(f"https://ipwho.is/{ip}", timeout=5)
    d = r.json()
    if d.get("success"):
        return d.get("country",""), d.get("region",""), d.get("city",""), d.get("postal","")
    return None
def _geo_ipapico(ip):
    r = requests.get(f"https://ipapi.co/{ip}/json/", timeout=5)
    d = r.json()
    if not d.get("error"):
        return d.get("country_name",""), d.get("region",""), d.get("city",""), d.get("postal","")
    return None
def _geo_freeipapi(ip):
    r = requests.get(f"https://freeipapi.com/api/json/{ip}", timeout=5)
    d = r.json()
    if d.get("ipVersion"):
        return d.get("countryName",""), d.get("regionName",""), d.get("cityName",""), d.get("zipCode","")
    return None
def geolocalizarIP(ip):
    resultados = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futures = {ex.submit(f, ip): f for f in [_geo_ipapi, _geo_ipwho, _geo_ipapico, _geo_freeipapi]}
        for future in futures:
            try:
                r = future.result(timeout=6)
                if r: resultados.append(r)
            except: pass
    if not resultados: return "", "", "", ""
    paises   = [r[0] for r in resultados if r[0]]
    regions  = [r[1] for r in resultados if r[1]]
    ciudades = [r[2] for r in resultados if r[2]]
    zips     = [r[3] for r in resultados if len(r) > 3 and r[3]]
    return (
        Counter(paises).most_common(1)[0][0]   if paises   else "",
        Counter(regions).most_common(1)[0][0]  if regions  else "",
        Counter(ciudades).most_common(1)[0][0] if ciudades else "",
        Counter(zips).most_common(1)[0][0]     if zips     else "",
    )
# ── Google Sheets ────────────────────────────────────────────────
def conectar_google_sheets():
    try:
        scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
        creds  = Credentials.from_service_account_file(CREDENCIALES_JSON, scopes=scopes)
        client = gspread.authorize(creds)
        ws     = client.open_by_url(GOOGLE_SHEET_URL).worksheet(GOOGLE_SHEET_TAB)
        gui_log(f"Google Sheets conectado — {GOOGLE_SHEET_TAB}", "success")
        return ws
    except Exception as e:
        gui_log(f"Error Google Sheets: {e}", "error")
        return None
def guardar_en_google_sheets(ws_google, account_id, fresh_correo, fresh_pass, linea_completa):
    try:
        fecha_inicial = datetime.now().strftime("%d/%m/%Y")
        fecha_final   = (datetime.now() + timedelta(days=2)).strftime("%d/%m/%Y")
        ws_google.append_row([account_id, TIPO_CUENTA, f"{fresh_correo}:{fresh_pass}", fecha_inicial, fecha_final, "", linea_completa], value_input_option='USER_ENTERED')
        gui_log("Guardado en Google Sheets ✓", "success")
        return True
    except Exception as e:
        gui_log(f"Error Google Sheets: {e}", "error")
        return False
# ── Telegram ─────────────────────────────────────────────────────
def obtener_total_paginas(mensaje):
    if not mensaje.reply_markup: return 1
    for fila in mensaje.reply_markup.rows:
        for boton in fila.buttons:
            m = re.search(r'\d+[\\\/](\d+)', getattr(boton, 'text', ''))
            if m: return int(m.group(1))
    return 1
def obtener_pagina_actual(mensaje):
    if not mensaje.reply_markup: return 1
    for fila in mensaje.reply_markup.rows:
        for boton in fila.buttons:
            m = re.search(r'(\d+)[\\\/]\d+', getattr(boton, 'text', ''))
            if m: return int(m.group(1))
    return 1
async def leer_todas_las_paginas(client, bot_username, id_enviado):
    texto_total     = ""
    ultimo_id       = id_enviado
    msg_con_botones = None
    for _ in range(30):
        await asyncio.sleep(1)
        mensajes = await client.get_messages(bot_username, min_id=ultimo_id, limit=10)
        if mensajes:
            for msg in reversed(mensajes):
                if msg.id > ultimo_id:
                    texto_total += (msg.text or "") + "\n"
                    if msg.reply_markup: msg_con_botones = msg
                    ultimo_id = msg.id
            if msg_con_botones: break
    if not msg_con_botones: return texto_total
    total_paginas  = obtener_total_paginas(msg_con_botones)
    paginas_leidas = {obtener_pagina_actual(msg_con_botones)}
    for _ in range(total_paginas * 3):
        if len(paginas_leidas) >= total_paginas: break
        botones_page = []
        if msg_con_botones.reply_markup:
            for fila in msg_con_botones.reply_markup.rows:
                for boton in fila.buttons:
                    data = getattr(boton, 'data', b'')
                    data_str = data.decode() if data else ''
                    if data_str.startswith('Page '):
                        partes = data_str.split()
                        if len(partes) >= 2:
                            try: botones_page.append((int(partes[1]), data))
                            except: pass
        if not botones_page: break
        pagina_actual = obtener_pagina_actual(msg_con_botones)
        botones_page.sort(key=lambda x: x[0])
        data_siguiente = None
        for num, data in botones_page:
            if num >= pagina_actual:
                data_siguiente = data
                break
        if not data_siguiente: break
        texto_total += (msg_con_botones.text or "") + "\n"
        try:
            await client(GetBotCallbackAnswerRequest(peer=bot_username, msg_id=msg_con_botones.id, data=data_siguiente))
            await asyncio.sleep(2)
            mensajes_nuevos = await client.get_messages(bot_username, min_id=ultimo_id, limit=5)
            if mensajes_nuevos:
                for msg in reversed(mensajes_nuevos):
                    if msg.id > ultimo_id:
                        texto_total += (msg.text or "") + "\n"
                        if msg.reply_markup: msg_con_botones = msg
                        ultimo_id = msg.id
                paginas_leidas.add(obtener_pagina_actual(msg_con_botones))
                continue
            msg_actualizado = await client.get_messages(bot_username, ids=msg_con_botones.id)
            if msg_actualizado:
                msg_con_botones = msg_actualizado
                paginas_leidas.add(obtener_pagina_actual(msg_con_botones))
        except Exception as e:
            gui_log(f"Error paginacion: {e}", "error")
            break
    texto_total += (msg_con_botones.text or "") + "\n"
    return texto_total
# ── AdsPower ─────────────────────────────────────────────────────
def monitor_alerta_windows():
    for _ in range(60):
        time.sleep(0.5)
        try:
            hwnd = win32gui.FindWindow("Chrome_WidgetWin_1", None)
            if hwnd:
                win32gui.SetForegroundWindow(hwnd)
                time.sleep(0.3)
                ctypes.windll.user32.keybd_event(0x1B, 0, 0, 0)
                time.sleep(0.1)
                ctypes.windll.user32.keybd_event(0x1B, 0, 2, 0)
                time.sleep(0.3)
        except: pass
def eliminar_perfil_adspower(perfil_id):
    try:
        requests.post(f"{ADSPOWER_API}/api/v1/user/delete",
            json={"user_ids": [perfil_id]},
            headers={"Content-Type": "application/json"}, timeout=10)
    except: pass
def crear_perfil_adspower():
    try:
        payload = {
            "group_id": "0",
            "fingerprint_config": {
                "device_memory": 8,
                "language": ["en-US"],
                "screen_resolution": "1920_1080",
                "os": "Windows",
                "browser": "Chrome",
                "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            },
            "user_proxy_config": {"proxy_soft": "other", "proxy_type": "socks5", "proxy_host": "127.0.0.1", "proxy_port": str(PUERTO_FORWARD)}
        }
        r = requests.post(f"{ADSPOWER_API}/api/v1/user/create", json=payload, headers={"Content-Type": "application/json"}, timeout=10)
        data = r.json()
        if data.get('code') == 0:
            return data['data']['id']
    except Exception as e:
        gui_log(f"Error AdsPower: {e}", "error")
    return None
def abrir_perfil_adspower(perfil_id):
    try:
        r = requests.get(f"{ADSPOWER_API}/api/v1/browser/start?user_id={perfil_id}", timeout=30)
        if r.json().get('code') == 0:
            return True
    except Exception as e:
        gui_log(f"Error perfil: {e}", "error")
    return False
def elemento_existe(driver, selector, by=By.CSS_SELECTOR, timeout=5):
    try:
        WebDriverWait(driver, timeout).until(EC.presence_of_element_located((by, selector)))
        return True
    except: return False
def login_outlook_chrome(fresh_correo, fresh_pass):
    try:
        perfil_temp = tempfile.mkdtemp()
        options = Options()
        options.add_argument(f"--user-data-dir={perfil_temp}")
        options.add_argument("--disable-autofill-keyboard-accessory-view")
        options.add_argument("--disable-features=AutofillEnableAccountWalletStorage,WebAuthn,PasskeysInChrome,WebAuthentication,WebAuthenticationUI")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(30)
        driver.get("https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=16&ct=1678886400&rver=7.0.6737.0&wp=MBI_SSL&wreply=https%3A%2F%2Foutlook.live.com%2Fowa%2F&id=292841")
        time.sleep(3)
        if elemento_existe(driver, "input[type='email']", timeout=10):
            campo = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
            campo.click(); time.sleep(0.5)
            campo.send_keys(Keys.CONTROL + "a"); campo.send_keys(Keys.DELETE); time.sleep(0.5)
            campo.send_keys(fresh_correo); time.sleep(0.5)
            campo.send_keys(Keys.RETURN); time.sleep(3)
        threading.Thread(target=monitor_alerta_windows, daemon=True).start()
        if elemento_existe(driver, "input[type='password']", timeout=10):
            campo = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password']")))
            campo.click(); time.sleep(0.5)
            campo.send_keys(Keys.CONTROL + "a"); campo.send_keys(Keys.DELETE); time.sleep(0.5)
            campo.send_keys(fresh_pass); time.sleep(0.5)
            campo.send_keys(Keys.RETURN); time.sleep(3)
        for _ in range(5):
            try:
                skip = WebDriverWait(driver, 6).until(EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Skip for now')] | //button[contains(text(), 'Skip for now')]")))
                skip.click(); time.sleep(2)
            except: break
        for xpath in [
            "//button[contains(text(), 'Cancel') or contains(text(), 'Cancelar')]",
            "//input[@value='No'] | //button[text()='No']",
            "//button[contains(text(), 'Aceptar todas') or contains(text(), 'Accept all')]"
        ]:
            try:
                btn = WebDriverWait(driver, 8).until(EC.element_to_be_clickable((By.XPATH, xpath)))
                btn.click(); time.sleep(2)
            except: pass
        gui_log("Outlook listo ✓", "success")
        return driver
    except Exception as e:
        gui_log(f"Error Outlook: {e}", "error")
        return None
# ── Geolocate alternativa ────────────────────────────────────────
def geolocate_alternativo(ip):
    """Busca ciudad, region, pais y zip usando ip2location.io."""
    try:
        r = requests.get(
            f"https://api.ip2location.io/?key={GEOLOCATION_API_KEY}&ip={ip}",
            timeout=5
        )
        d = r.json()
        if d.get("city_name"):
            return (
                d.get("country_name",""),
                d.get("region_name",""),
                d.get("city_name",""),
                d.get("zip_code",""),
            )
    except: pass
    return "", "", "", ""

# ── 9Proxy ──────────────────────────────────────────────────────


def guardar_linea_con_fresh(linea_completa, fresh_correo, fresh_pass):
    """Guarda la linea completa junto con el fresh usado en un TXT."""
    try:
        if not os.path.exists(archivo_lineas_fresh):
            with open(archivo_lineas_fresh, "w", encoding="utf-8") as f:
                f.write("Fresh usado|||Linea completa\n")
                f.write("-" * 100 + "\n")
        with open(archivo_lineas_fresh, "a", encoding="utf-8") as f:
            f.write(f"{fresh_correo}:{fresh_pass}|||{linea_completa}\n")
        gui_log("Linea con fresh guardada ✓", "success")
    except Exception as e:
        gui_log(f"Error guardando linea con fresh: {e}", "error")

# ── Recovery ─────────────────────────────────────────────────────
def abrir_sunbrowser_para_correo(correo, ciudad, region, pais, zip_code, ip, datos_correo, todos_nombres, fresh_list, fresh_index, ws_google, linea_completa, numero_actual, total, cosmeticos):
    ip_prefix = '.'.join(ip.split('.')[:2]) if ip else "desconocido"
    fresh = fresh_list[fresh_index] if fresh_index < len(fresh_list) else None
    gui_datos({
        'correo'      : correo,
        'account_id'  : datos_correo['account_id'],
        'username'    : datos_correo['username'],
        'xbox'        : datos_correo['xbl'],
        'psn'         : datos_correo['psn'],
        'nombres'     : ", ".join(todos_nombres) if todos_nombres else "No encontrado",
        'ip'          : ip,
        'zip'         : zip_code or "No encontrado",
        'ciudad'      : ciudad,
        'region'      : region,
        'pais'        : pais,
        'stw'         : cosmeticos.get('stw', 'No'),
        'characters'  : cosmeticos.get('characters', ''),
        'pickaxes'    : cosmeticos.get('pickaxes', ''),
        'backblings'  : cosmeticos.get('backblings', ''),
        'emotes'      : cosmeticos.get('emotes', ''),
        'fecha_xbox'  : calcular_fecha_xbox(cosmeticos.get('emotes',''), cosmeticos, pais) or "—",
        'fresh_correo': fresh['correo']   if fresh else "Sin freshs",
        'fresh_pass'  : fresh['password'] if fresh else "Agrega al fresh2.txt",
        'epic_url'    : get_epic_url(pais),
    })
    # Geolocate alternativa en hilo separado para no bloquear
    def _geo_alt():
        try:
            geo_pais, geo_region, geo_ciudad, geo_zip = geolocate_alternativo(ip)
            gui_datos({
                'geo_pais'  : geo_pais,
                'geo_region': geo_region,
                'geo_ciudad': geo_ciudad,
                'geo_zip'   : geo_zip,
            })
        except: pass
    threading.Thread(target=_geo_alt, daemon=True).start()
    gui_progress(numero_actual, total)
    gui_status(f"Recovery {numero_actual}/{total}", "#2ec4b6")
    gui_log("", "muted")
    gui_log(f"{'─'*48}", "muted")
    gui_log(f"Correo [{numero_actual}/{total}]: {correo}", "info")
    respuesta = esperar_proxy_con_deshacer()
    if respuesta == "s":
        gui_log("Saltado.", "muted")
        return fresh_index, True
    if respuesta == "DESHACER":
        gui_log("↩ Deshaciendo salto...", "warning")
        app = get_app()
        if app: app.queue.put({"tipo": "disable_deshacer"})
        return fresh_index, "DESHACER"
    perfil_id = crear_perfil_adspower()
    if not perfil_id:
        gui_log("Error AdsPower", "error")
        return fresh_index, False
    if not abrir_perfil_adspower(perfil_id):
        gui_log("Error SunBrowser", "error")
        eliminar_perfil_adspower(perfil_id)
        return fresh_index, False
    time.sleep(2)
    if fresh:
        gui_log("Abriendo Outlook...", "info")
        threading.Thread(target=login_outlook_chrome, args=(fresh['correo'], fresh['password']), daemon=True).start()
    gui_log("SunBrowser abierto. Haz el recovery y presiona Continuar.", "info")
    esperar_respuesta("recovery")
    gui_log("¿Completaste el recovery?", "info")
    respuesta = esperar_respuesta("confirmar")
    if respuesta == "s":
        gui_log("Recovery no completado — puedes deshacer para reintentar.", "warning")
        eliminar_perfil_adspower(perfil_id)
        return fresh_index, True  # True = saltado, permite deshacer
    gui_log(f"Sheets: {'conectado' if ws_google else 'NO CONECTADO'}", "muted")
    gui_log(f"Fresh: {fresh['correo'] if fresh else 'SIN FRESH'}", "muted")
    gui_log(f"AccountId: {datos_correo['account_id']}", "muted")
    if ws_google and fresh:
        guardar_en_google_sheets(ws_google, datos_correo['account_id'], fresh['correo'], fresh['password'], linea_completa)
        borrar_fresh_usado(fresh['correo'])
        fresh_index += 1
    elif not ws_google:
        gui_log("⚠ Sin guardar: Google Sheets no conectado", "error")
    elif not fresh:
        gui_log("⚠ Sin guardar: no hay fresh disponible", "error")
    marcar_recovery_completado(correo)
    if fresh:
        guardar_linea_con_fresh(linea_completa, fresh['correo'], fresh['password'])
    enviar_a_inventario(datos_correo['account_id'], correo, fresh['correo'] if fresh else "", fresh['password'] if fresh else "")
    gui_log("✅ Recovery completado y guardado", "success")
    gui_status("Guardado ✓", "#3dd68c")
    eliminar_perfil_adspower(perfil_id)
    return fresh_index, False
# ── Main ─────────────────────────────────────────────────────────
async def run_script():
    # Verificar si hay sesion — si no, pedir login
    if not os.path.exists(os.path.join(_BASE_DIR, 'sesion_actualizada.session')):
        gui_log("No hay sesion de Telegram — iniciando login...", "warning")
        if not await login_telegram_gui():
            gui_log("Login cancelado.", "error")
            return
    gui_status("Conectando Telegram...", "#ffd166")
    client = TelegramClient(os.path.join(_BASE_DIR, 'sesion_actualizada'), api_id, api_hash)
    await client.start()
    gui_log("Telegram conectado ✓", "success")
    if not os.path.exists(archivo_txt):
        gui_log(f"Error: no se encontro {archivo_txt}", "error")
        return
    with open(archivo_txt, "r", encoding="utf-8") as f:
        contenido = f.read()
    fresh_list = []
    if os.path.exists(archivo_fresh):
        with open(archivo_fresh, "r", encoding="utf-8") as f:
            for linea in f.read().split("\n"):
                linea = linea.strip()
                if linea and ':' in linea:
                    partes = linea.split(':', 1)
                    fresh_list.append({'correo': partes[0].strip(), 'password': partes[1].strip()})
    gui_freshs(len(fresh_list))
    gui_log(f"Freshs disponibles: {len(fresh_list)}", "info")
    gui_status("Conectando Google Sheets...", "#ffd166")
    ws_google = conectar_google_sheets()
    correos_con_ip = extraer_correos_con_ip(contenido)
    total    = len(correos_con_ip)
    contador = 0
    procesados_txt = set()
    if os.path.exists(archivo_resultados):
        with open(archivo_resultados, "r", encoding="utf-8") as f:
            for linea in f.readlines()[2:]:
                linea = linea.strip()
                if linea and "|||" in linea:
                    procesados_txt.add(linea.split("|||")[0])
    screach_procesados     = cargar_screach_procesados()
    recoveries_completados = cargar_recoveries_completados()
    gui_log(f"Total correos: {total}", "info")
    gui_status("Extrayendo nombres...", "#ffd166")
    inicio = time.time()
    correos_con_nombre = []
    for correo, ip in correos_con_ip.items():
        contador += 1
        gui_progress(contador, total)
        if correo in procesados_txt:
            if correo not in recoveries_completados:
                datos_txt = leer_datos_del_txt(correo)
                if datos_txt:
                    datos_correo   = extraer_datos_correo(contenido, correo)
                    linea_completa = obtener_linea_completa_correo(contenido, correo)
                    cosmeticos     = extraer_cosmeticos(contenido, correo)
                    correos_con_nombre.append({
                        'correo': correo, 'ip': datos_txt['ip'],
                        'ciudad': datos_txt['ciudad'], 'region': datos_txt['region'],
                        'pais': datos_txt['pais'], 'zip_code': datos_txt['zip_code'],
                        'datos_correo': datos_correo, 'todos_nombres': datos_txt['nombres'],
                        'linea_completa': linea_completa, 'cosmeticos': cosmeticos,
                    })
            continue
        if correo in screach_procesados:
            gui_log(f"[{contador}/{total}] {correo} — ya procesado", "muted")
            continue
        try:
            gui_log(f"[{contador}/{total}] {correo}", "")
            loop       = asyncio.get_running_loop()
            geo_future = loop.run_in_executor(None, geolocalizarIP, ip) if ip else None
            enviado        = await client.send_message(bot_username, correo)
            texto_completo = await leer_todas_las_paginas(client, bot_username, enviado.id)
            marcar_screach_procesado(correo)
            todos_nombres, nombre_principal = extraer_todos_los_nombres(texto_completo, correo)
            if nombre_principal == "No encontrado":
                gui_log(f"  ❌ No encontrado", "error")
                if geo_future:
                    try: await geo_future
                    except: pass
                continue
            pais, region, ciudad, zip_code = await geo_future if geo_future else ("","","","")
            datos_correo   = extraer_datos_correo(contenido, correo)
            linea_completa = obtener_linea_completa_correo(contenido, correo)
            cosmeticos     = extraer_cosmeticos(contenido, correo)
            guardar_en_txt(correo, datos_correo['account_id'], datos_correo['username'],
                           datos_correo['xbl'], datos_correo['psn'], todos_nombres,
                           ip or "", pais, region, ciudad, zip_code)
            gui_log(f"  ✅ {nombre_principal} | {ciudad}, {pais}", "success")
            correos_con_nombre.append({
                'correo': correo, 'ip': ip or "",
                'ciudad': ciudad, 'region': region, 'pais': pais, 'zip_code': zip_code,
                'datos_correo': datos_correo, 'todos_nombres': todos_nombres,
                'linea_completa': linea_completa, 'cosmeticos': cosmeticos,
            })
        except Exception as e:
            gui_log(f"Error en {correo}: {e}", "error")
        await asyncio.sleep(3)
    total_seg = int(time.time() - inicio)
    h = total_seg // 3600; m = (total_seg % 3600) // 60; s = total_seg % 60
    tiempo_str = f"{h}h {m}m {s}s" if h > 0 else f"{m}m {s}s" if m > 0 else f"{s}s"
    gui_log("", "info")
    gui_log(f"─── Extraccion terminada — {tiempo_str}", "info")
    gui_log(f"Correos con nombre: {len(correos_con_nombre)}", "success")
    if correos_con_nombre:
        total_recovery = len(correos_con_nombre)
        gui_status(f"Recovery — {total_recovery} correos", "#ffd166")
        gui_log("", "accent")
        gui_log(f"─── INICIANDO ACCOUNT RECOVERY ───", "accent")
        fresh_index = 0
        saltados = []
        i = 0
        lista_recovery = list(correos_con_nombre)
        for idx, datos in enumerate(lista_recovery):
            datos['_num_original'] = idx + 1
        while i < len(lista_recovery):
            datos = lista_recovery[i]
            fresh_index, resultado = abrir_sunbrowser_para_correo(
                datos['correo'], datos['ciudad'], datos['region'], datos['pais'],
                datos['zip_code'], datos['ip'], datos['datos_correo'], datos['todos_nombres'],
                fresh_list, fresh_index, ws_google, datos['linea_completa'],
                datos['_num_original'], total_recovery, datos['cosmeticos'],
            )
            if resultado == True:
                saltados.append(datos)
                i += 1
            elif resultado == "DESHACER" and saltados:
                ultimo = saltados.pop()
                lista_recovery.insert(i, ultimo)
                app_ref = get_app()
                if app_ref and saltados:
                    app_ref.queue.put({"tipo": "set_deshacer_count", "count": len(saltados)})
            else:
                app_ref = get_app()
                if app_ref: app_ref.queue.put({"tipo": "disable_deshacer"})
                i += 1
        gui_log("", "success")
        gui_log("─── TODOS LOS CORREOS PROCESADOS ───", "success")
        gui_status("Completado ✓", "#3dd68c")
    while not _cola_raw.empty():
        try:
            nuevos_raw = _cola_raw.get_nowait()
            gui_log("", "info")
            gui_log(f"─── CORREOS RECARGADOS ───", "accent")
            with open(archivo_txt, "r", encoding="utf-8") as _f:
                contenido_r = _f.read()
            correos_r = []
            total_r   = len(nuevos_raw)
            cnt_r     = 0
            for correo_r, ip_r in nuevos_raw.items():
                cnt_r += 1
                gui_log(f"[{cnt_r}/{total_r}] {correo_r}", "")
                try:
                    loop_r  = asyncio.get_running_loop()
                    geo_fut = loop_r.run_in_executor(None, geolocalizarIP, ip_r) if ip_r else None
                    enviado_r  = await client.send_message(bot_username, correo_r)
                    texto_r    = await leer_todas_las_paginas(client, bot_username, enviado_r.id)
                    marcar_screach_procesado(correo_r)
                    nombres_r, nombre_p = extraer_todos_los_nombres(texto_r, correo_r)
                    if nombre_p == "No encontrado":
                        gui_log(f"  No encontrado", "error")
                        continue
                    pais_r, region_r, ciudad_r, zip_r = await geo_fut if geo_fut else ("","","","")
                    datos_c_r = extraer_datos_correo(contenido_r, correo_r)
                    cosm_r    = extraer_cosmeticos(contenido_r, correo_r)
                    guardar_en_txt(correo_r, datos_c_r['account_id'], datos_c_r['username'],
                                   datos_c_r['xbl'], datos_c_r['psn'], nombres_r,
                                   ip_r or "", pais_r, region_r, ciudad_r, zip_r)
                    correos_r.append({
                        "correo": correo_r, "ip": ip_r or "",
                        "ciudad": ciudad_r, "region": region_r, "pais": pais_r, "zip_code": zip_r,
                        "datos_correo": datos_c_r, "todos_nombres": nombres_r,
                        "linea_completa": obtener_linea_completa_correo(contenido_r, correo_r),
                        "cosmeticos": cosm_r,
                    })
                    gui_log(f"  ✅ {nombres_r}", "success")
                except Exception as e_r:
                    gui_log(f"  Error: {e_r}", "error")
            fresh_index_r = 0
            for i_r, datos_r in enumerate(correos_r, 1):
                fresh_index_r = abrir_sunbrowser_para_correo(
                    datos_r['correo'], datos_r['ciudad'], datos_r['region'], datos_r['pais'],
                    datos_r['zip_code'], datos_r['ip'], datos_r['datos_correo'], datos_r['todos_nombres'],
                    fresh_list, fresh_index_r, ws_google, datos_r['linea_completa'],
                    i_r, len(correos_r), datos_r['cosmeticos'],
                )
        except _queue.Empty:
            break
def recargar_correos():
    if not os.path.exists(archivo_txt):
        gui_log(f"No se encontro {archivo_txt}", "error")
        return
    with open(archivo_txt, "r", encoding="utf-8") as f:
        contenido = f.read()
    correos_nuevos = extraer_correos_con_ip(contenido)
    completados    = cargar_recoveries_completados()
    procesados_txt = set()
    if os.path.exists(archivo_resultados):
        with open(archivo_resultados, "r", encoding="utf-8") as f:
            for linea in f.readlines()[2:]:
                if "|||" in linea:
                    procesados_txt.add(linea.split("|||")[0].strip())
    nuevos = {c: ip for c, ip in correos_nuevos.items()
              if c not in procesados_txt and c not in completados}
    if not nuevos:
        gui_log("No hay correos nuevos.", "muted")
        return
    gui_log(f"Correos nuevos: {len(nuevos)} — en cola para screach.", "success")
    _cola_raw.put(nuevos)
def esperar_start():
    app = get_app()
    if not app: return
    app.log("Presiona  ▶ Start  para comenzar.", "info")
    app.start_var.set("")
    while True:
        val = app.start_var.get()
        if val == "START": break
        if val == "STOP": app.start_var.set("")
        time.sleep(0.1)
def start_script():
    esperar_start()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(run_script())
if __name__ == "__main__":
    import multiprocessing, logging as _logging
    multiprocessing.freeze_support()
    # Log de errores a archivo
    try:
        _log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'error_log.txt')
        _logging.basicConfig(
            filename=_log_path,
            level=_logging.ERROR,
            format='%(asctime)s — %(levelname)s — %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        import sys as _sys2
        def _handle_exception(exc_type, exc_value, exc_tb):
            if issubclass(exc_type, KeyboardInterrupt):
                _sys2.__excepthook__(exc_type, exc_value, exc_tb)
                return
            _logging.critical("Error no manejado", exc_info=(exc_type, exc_value, exc_tb))
        _sys2.excepthook = _handle_exception
    except: pass
    # Evitar doble apertura en Nuitka onefile
    import os as _os
    if _os.environ.get("_NUITKA_SUBPROCESS_") == "1":
        import sys; sys.exit(0)
    _os.environ["_NUITKA_SUBPROCESS_"] = "1"
    try:
        if not verificar_licencia():
            import sys; sys.exit(0)
    except Exception:
        pass
    app = iniciar_gui()
    set_app(app)
    app.log("DzPulls BMO Edition iniciado ✓", "success")
    app._recargar_callback = recargar_correos
    threading.Thread(target=start_script, daemon=True).start()
    app.mainloop()# ── Geolocate alternativa ────────────────────────────────────────
def geolocate_alternativo(ip):
    """Busca ciudad, region, pais y zip usando ip2location.io."""
    try:
        r = requests.get(
            f"https://api.ip2location.io/?key={GEOLOCATION_API_KEY}&ip={ip}",
            timeout=5
        )
        d = r.json()
        if d.get("city_name"):
            return (
                d.get("country_name",""),
                d.get("region_name",""),
                d.get("city_name",""),
                d.get("zip_code",""),
            )
    except: pass
    return "", "", "", ""

# ── 9Proxy ──────────────────────────────────────────────────────


def guardar_linea_con_fresh(linea_completa, fresh_correo, fresh_pass):
    """Guarda la linea completa junto con el fresh usado en un TXT."""
    try:
        if not os.path.exists(archivo_lineas_fresh):
            with open(archivo_lineas_fresh, "w", encoding="utf-8") as f:
                f.write("Fresh usado|||Linea completa\n")
                f.write("-" * 100 + "\n")
        with open(archivo_lineas_fresh, "a", encoding="utf-8") as f:
            f.write(f"{fresh_correo}:{fresh_pass}|||{linea_completa}\n")
        gui_log("Linea con fresh guardada ✓", "success")
    except Exception as e:
        gui_log(f"Error guardando linea con fresh: {e}", "error")

# ── Recovery ─────────────────────────────────────────────────────
def abrir_sunbrowser_para_correo(correo, ciudad, region, pais, zip_code, ip, datos_correo, todos_nombres, fresh_list, fresh_index, ws_google, linea_completa, numero_actual, total, cosmeticos):
    ip_prefix = '.'.join(ip.split('.')[:2]) if ip else "desconocido"
    fresh = fresh_list[fresh_index] if fresh_index < len(fresh_list) else None
    gui_datos({
        'correo'      : correo,
        'account_id'  : datos_correo['account_id'],
        'username'    : datos_correo['username'],
        'xbox'        : datos_correo['xbl'],
        'psn'         : datos_correo['psn'],
        'nombres'     : ", ".join(todos_nombres) if todos_nombres else "No encontrado",
        'ip'          : ip,
        'zip'         : zip_code or "No encontrado",
        'ciudad'      : ciudad,
        'region'      : region,
        'pais'        : pais,
        'stw'         : cosmeticos.get('stw', 'No'),
        'characters'  : cosmeticos.get('characters', ''),
        'pickaxes'    : cosmeticos.get('pickaxes', ''),
        'backblings'  : cosmeticos.get('backblings', ''),
        'emotes'      : cosmeticos.get('emotes', ''),
        'fecha_xbox'  : calcular_fecha_xbox(cosmeticos.get('emotes',''), cosmeticos, pais) or "—",
        'fresh_correo': fresh['correo']   if fresh else "Sin freshs",
        'fresh_pass'  : fresh['password'] if fresh else "Agrega al fresh2.txt",
        'epic_url'    : get_epic_url(pais),
    })
    # Geolocate alternativa en hilo separado para no bloquear
    def _geo_alt():
        try:
            geo_pais, geo_region, geo_ciudad, geo_zip = geolocate_alternativo(ip)
            gui_datos({
                'geo_pais'  : geo_pais,
                'geo_region': geo_region,
                'geo_ciudad': geo_ciudad,
                'geo_zip'   : geo_zip,
            })
        except: pass
    threading.Thread(target=_geo_alt, daemon=True).start()
    gui_progress(numero_actual, total)
    gui_status(f"Recovery {numero_actual}/{total}", "#2ec4b6")
    gui_log("", "muted")
    gui_log(f"{'─'*48}", "muted")
    gui_log(f"Correo [{numero_actual}/{total}]: {correo}", "info")
    respuesta = esperar_proxy_con_deshacer()
    if respuesta == "s":
        gui_log("Saltado.", "muted")
        return fresh_index, True
    if respuesta == "DESHACER":
        gui_log("↩ Deshaciendo salto...", "warning")
        app = get_app()
        if app: app.queue.put({"tipo": "disable_deshacer"})
        return fresh_index, "DESHACER"
    perfil_id = crear_perfil_adspower()
    if not perfil_id:
        gui_log("Error AdsPower", "error")
        return fresh_index, False
    if not abrir_perfil_adspower(perfil_id):
        gui_log("Error SunBrowser", "error")
        eliminar_perfil_adspower(perfil_id)
        return fresh_index, False
    time.sleep(2)
    if fresh:
        gui_log("Abriendo Outlook...", "info")
        threading.Thread(target=login_outlook_chrome, args=(fresh['correo'], fresh['password']), daemon=True).start()
    gui_log("SunBrowser abierto. Haz el recovery y presiona Continuar.", "info")
    esperar_respuesta("recovery")
    gui_log("¿Completaste el recovery?", "info")
    respuesta = esperar_respuesta("confirmar")
    if respuesta == "s":
        gui_log("Recovery no completado — puedes deshacer para reintentar.", "warning")
        eliminar_perfil_adspower(perfil_id)
        return fresh_index, True  # True = saltado, permite deshacer
    gui_log(f"Sheets: {'conectado' if ws_google else 'NO CONECTADO'}", "muted")
    gui_log(f"Fresh: {fresh['correo'] if fresh else 'SIN FRESH'}", "muted")
    gui_log(f"AccountId: {datos_correo['account_id']}", "muted")
    if ws_google and fresh:
        guardar_en_google_sheets(ws_google, datos_correo['account_id'], fresh['correo'], fresh['password'], linea_completa)
        borrar_fresh_usado(fresh['correo'])
        fresh_index += 1
    elif not ws_google:
        gui_log("⚠ Sin guardar: Google Sheets no conectado", "error")
    elif not fresh:
        gui_log("⚠ Sin guardar: no hay fresh disponible", "error")
    marcar_recovery_completado(correo)
    if fresh:
        guardar_linea_con_fresh(linea_completa, fresh['correo'], fresh['password'])
    enviar_a_inventario(datos_correo['account_id'], correo, fresh['correo'] if fresh else "", fresh['password'] if fresh else "")
    gui_log("✅ Recovery completado y guardado", "success")
    gui_status("Guardado ✓", "#3dd68c")
    eliminar_perfil_adspower(perfil_id)
    return fresh_index, False
# ── Main ─────────────────────────────────────────────────────────

def recargar_correos():
    if not os.path.exists(archivo_txt):
        gui_log(f"No se encontro {archivo_txt}", "error")
        return
    with open(archivo_txt, "r", encoding="utf-8") as f:
        contenido = f.read()
    correos_nuevos = extraer_correos_con_ip(contenido)
    completados    = cargar_recoveries_completados()
    procesados_txt = set()
    if os.path.exists(archivo_resultados):
        with open(archivo_resultados, "r", encoding="utf-8") as f:
            for linea in f.readlines()[2:]:
                if "|||" in linea:
                    procesados_txt.add(linea.split("|||")[0].strip())
    nuevos = {c: ip for c, ip in correos_nuevos.items()
              if c not in procesados_txt and c not in completados}
    if not nuevos:
        gui_log("No hay correos nuevos.", "muted")
        return
    gui_log(f"Correos nuevos: {len(nuevos)} — en cola para screach.", "success")
    _cola_raw.put(nuevos)
def esperar_start():
    app = get_app()
    if not app: return
    app.log("Presiona  ▶ Start  para comenzar.", "info")
    app.start_var.set("")
    while True:
        val = app.start_var.get()
        if val == "START": break
        if val == "STOP": app.start_var.set("")
        time.sleep(0.1)
def start_script():
    esperar_start()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(run_script())
if __name__ == "__main__":
    import multiprocessing, logging as _logging
    multiprocessing.freeze_support()
    # Log de errores a archivo
    try:
        _log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'error_log.txt')
        _logging.basicConfig(
            filename=_log_path,
            level=_logging.ERROR,
            format='%(asctime)s — %(levelname)s — %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        import sys as _sys2
        def _handle_exception(exc_type, exc_value, exc_tb):
            if issubclass(exc_type, KeyboardInterrupt):
                _sys2.__excepthook__(exc_type, exc_value, exc_tb)
                return
            _logging.critical("Error no manejado", exc_info=(exc_type, exc_value, exc_tb))
        _sys2.excepthook = _handle_exception
    except: pass
    # Evitar doble apertura en Nuitka onefile
    import os as _os
    if _os.environ.get("_NUITKA_SUBPROCESS_") == "1":
        import sys; sys.exit(0)
    _os.environ["_NUITKA_SUBPROCESS_"] = "1"
    try:
        if not verificar_licencia():
            import sys; sys.exit(0)
    except Exception:
        pass
    app = iniciar_gui()
    set_app(app)
    app.log("DzPulls BMO Edition iniciado ✓", "success")
    app._recargar_callback = recargar_correos
    threading.Thread(target=start_script, daemon=True).start()
    app.mainloop()