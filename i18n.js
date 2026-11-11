// English / Spanish. Default Spanish. Only exact strings in ES are translated; everything else
// (tab names Incoming/Plugs/Finished/2in/Addition, view names, plant data, Forecast #, QCell, sizes...) stays as is.
let lang = 'es';
try { const v = localStorage.getItem('ctg_lang'); if (v === 'en' || v === 'es') lang = v; } catch (e) { /* ignore */ }
export const getLang = () => lang;
export function setLang(l) { lang = l === 'en' ? 'en' : 'es'; try { localStorage.setItem('ctg_lang', lang); } catch (e) { /* ignore */ } document.documentElement.lang = lang; }

const ES = {
  // chrome
  'Saved': 'Guardado', 'Saving…': 'Guardando…', 'Offline – will send later': 'Sin conexión – se enviará después', 'Problem – tap to retry': 'Problema – toca para reintentar',
  'Search': 'Buscar', 'Refresh': 'Actualizar', 'Clear': 'Borrar', 'Back': 'Atrás', 'Close': 'Cerrar', 'User menu': 'Menú de usuario', 'Views': 'Vistas',
  'Loading…': 'Cargando…', 'Nothing here': 'No hay nada aquí', 'No items match this view right now.': 'Ahora no hay elementos en esta vista.',
  'Select an item': 'Selecciona un elemento', 'Details and actions appear here.': 'Aquí aparecen los detalles y las acciones.',
  'Select incoming vendor': 'Selecciona el proveedor', 'Tap one or more vendors above.': 'Toca uno o más proveedores arriba.',
  'Details': 'Detalles', 'More actions': 'Más acciones', 'More fields': 'Más campos', 'Watch video': 'Ver video',
  'Add a finished planting record': 'Agregar un registro de plantado de terminadas', 'New finished planting': 'Nuevo plantado de terminadas',
  'Record plants you planted that are not on the list.': 'Registra plantas que plantaste y que no están en la lista.', 'Add record': 'Agregar registro',
  'Yes': 'Sí', 'No': 'No', 'Save': 'Guardar', 'Cancel': 'Cancelar',
  // row tags / actions
  'Planted': 'Plantado', 'Flagged': 'Bandera puesta', 'Transferred': 'Transferido', 'Label added': 'Etiqueta agregada',
  'Planting': 'Plantar', 'Label printing': 'Imprimir etiqueta', 'Flag': 'Poner bandera', 'Add reason why not planted': 'Agregar motivo: no se plantó',
  'Add labels': 'Agregar etiquetas', 'Labels added by': 'Etiquetas agregadas por',
  '+ Addition': '+ Adición', 'Add a planting record': 'Agregar un registro de plantado', 'For plants that are not in the list.': 'Para plantas que no están en la lista.',
  'Plugs Addition': 'Adición de plugs', 'Finished Addition': 'Adición de terminadas',
  'Plug planting record': 'Registro de plantado de plugs', 'Plug label printing record': 'Registro de etiquetas de plugs', 'Finished planting record': 'Registro de plantado de terminadas',
  'Finished label printing record': 'Registro de etiquetas de terminadas', 'Plug planting start': 'Inicio de plantado de plugs', 'Finished planting start': 'Inicio de plantado de terminadas',
  'Incoming audit reason': 'Motivo de auditoría de llegadas', 'Plugs audit reason': 'Motivo de auditoría de plugs', 'Finished audit reason': 'Motivo de auditoría de terminadas', 'Label added by': 'Etiqueta agregada por',
  // detail columns
  'Goal': 'Meta', 'Vendor': 'Proveedor', 'Genus': 'Género', 'Variety': 'Variedad', 'Location': 'Ubicación', 'Plant Date': 'Fecha de plantado', 'Ready Date': 'Fecha lista',
  'Qty of flats': 'Cantidad de flats', 'From Contain': 'Contenedor de origen', 'ToContain': 'Contenedor destino', 'Incoming Week': 'Semana de llegada', 'Plant Week': 'Semana de plantado',
  'Ready Week': 'Semana lista', 'Reason why not planted': 'Motivo por el que no se plantó', 'Reason why not flagged': 'Motivo por el que no se puso bandera', 'Reason why not checked': 'Motivo por el que no se revisó',
  'Assortment': 'Surtido', 'Plug Location': 'Ubicación del plug', 'Location planted': 'Ubicación plantada', 'Qty planted': 'Cantidad plantada', 'Actual Plant Date': 'Fecha real de plantado',
  'Labels inventory qty': 'Etiquetas en inventario', 'Qty not incoming': 'Cantidad sin pedido', 'Inputs on Order': 'Pedido en camino', 'URC Priority': 'Prioridad URC',
  // forms
  'Plant': 'Planta', 'Size': 'Tamaño', 'Quantity (plugs, not flats)': 'Cantidad (plugs, no flats)', 'Employee': 'Empleado', 'Employee 2': 'Empleado 2',
  'Plant Date': 'Fecha de plantado', 'Ready Date': 'Fecha lista', 'Qty Projected': 'Cantidad proyectada', 'Plug Type': 'Tipo de plug',
  'Plugs used': 'Plugs usados', 'Choose plant': 'Elegir planta', 'Plug Location': 'Ubicación del plug', 'Item code': 'Código de artículo',
  'From': 'Origen', 'Finished size': 'Terminada', 'Less': 'Menos', 'More': 'Más', 'Asst': 'Surtido', 'Vendor': 'Proveedor',
  'no Google account set': 'sin cuenta de Google',
  'Please fill: ': 'Por favor completa: ',
  // Empieza + alerts
  'not yet today': 'aún no hoy', 'Starting work?': '¿Empiezas a trabajar?', 'Back from lunch?': '¿Regresaste del almuerzo?',
  'Tap Empieza now to start your day, so your work time is recorded correctly.': 'Toca Empieza ahora para comenzar tu día y que tu tiempo de trabajo se registre bien.',
  'Tap Empieza now, so your work time is recorded correctly.': 'Toca Empieza ahora para que tu tiempo de trabajo se registre bien.',
  'Plugs – Empieza': 'Plugs – Empieza', 'Finished – Empieza': 'Finished – Empieza',
  'Not yet – remind me in 10 min': 'Todavía no – recuérdamelo en 10 min', 'Not back yet – remind me in 10 min': 'Aún no vuelvo – recuérdamelo en 10 min',
  'Empieza – start work': 'Empieza – empezar a trabajar', 'Tap this every time you start again: morning, after break, lunch, pulling or other work. It is saved right away with your name.': 'Toca esto cada vez que empieces de nuevo: mañana, después del descanso, almuerzo, sacar pedidos u otro trabajo. Se guarda al instante con tu nombre.',
  'Yes, submit again': 'Sí, enviar otra vez', 'No, cancel': 'No, cancelar',
  // menu / login
  'Refresh now': 'Actualizar ahora', 'Switch user': 'Cambiar de usuario', 'Language': 'Idioma', 'not set': 'sin definir',
  'Which Google account is this tablet signed in to?': '¿Con qué cuenta de Google está esta tableta?', 'Pick it once. It is saved with every record as the Email Address (like AppSheet did).': 'Elígela una vez. Se guarda con cada registro como Email Address (como hacía AppSheet).',
  'Your name': 'Tu nombre', 'Google account of this tablet': 'Cuenta de Google de esta tableta', 'Access code': 'Código de acceso', 'Continue': 'Continuar',
  'Choose account…': 'Elegir cuenta…', 'No connection. Try again.': 'Sin conexión. Inténtalo de nuevo.', 'Could not sign in': 'No se pudo iniciar sesión',
  'Enter your name, then sign in with the Google account of this tablet.': 'Escribe tu nombre y luego inicia sesión con la cuenta de Google de esta tableta.',
  'Please enter your name first, then sign in with Google.': 'Primero escribe tu nombre y luego inicia sesión con Google.', 'e.g. Maria': 'p. ej. María'
};
export function t(s) { return lang === 'es' && typeof s === 'string' && ES[s] !== undefined ? ES[s] : s; }
// helpers for composed texts
export const tItems = n => lang === 'es' ? (n === 1 ? 'elemento' : 'elementos') : (n === 1 ? 'item' : 'items');
export const tSignedIn = n => (lang === 'es' ? 'Sesión de ' : 'Signed in as ') + n;
export const tGoogle = e => (lang === 'es' ? 'Cuenta de Google: ' : 'Google account: ') + e;
export const tTablet = e => (lang === 'es' ? 'Cuenta de la tableta: ' : 'Tablet account: ') + (e || t('not set'));
export const tTitle = (kind, ago, at) => lang === 'es' ? 'Empieza ' + kind + ' – ¿enviar otra vez?' : 'Empieza ' + kind + ' – submit again?';
export const tAgain = (kind, ago, at) => lang === 'es' ? 'Ya enviaste Empieza ' + kind + ' hace ' + ago + ' (a las ' + at + '). ¿Seguro que quieres enviarlo otra vez?' : 'You already submitted Empieza ' + kind + ' ' + ago + ' ago (at ' + at + '). Are you sure you want to submit again?';
export const tSaved = (kind, name, at) => lang === 'es' ? '✓ Empieza ' + kind + ' guardado – ' + name + ' ' + at : '✓ Empieza ' + kind + ' saved – ' + name + ' ' + at;
