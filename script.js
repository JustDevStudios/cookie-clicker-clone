// Versión del juego
const VERSION = '1.2.0';

// Registro de cambios (changelog)
const CHANGELOG = {
    '1.2.0': [
        'Añadido easter egg secreto... ¿enserio pensabas que iba a ser tan facil?',
        'Mejorado sistema de logros',
        'Añadidos nuevos logros secretos',
        'Mejorada la visualización de logros con efectos especiales',
        'Añadido sistema de notificaciones mejorado',
        'Corregidos bugs menores'
    ],
    '1.1.0': [
        'Añadido sistema de prestigio',
        'Añadidos chips celestiales',
        'Añadido multiplicador celestial',
        'Añadido menú de legado',
        'Mejorado sistema de guardado'
    ],
    '1.0.0': [
        'Versión inicial del juego',
        'Sistema básico de clicks',
        'Sistema de edificios',
        'Sistema de mejoras',
        'Sistema de logros básico',
        'Sistema de guardado básico'
    ]
};

// Variables del juego
let cookies = 0;
let cookiesPerSecond = 0;
let cookiesPerClick = 1;
let multiplier = 1;
let bakeryName = "La confitería de aleko";
let buyMultiplier = 1;
let heavenlyChips = 0;
let heavenlyMultiplier = 1;

// Variables para los nuevos logros
let clickCounter = 0;
let lastClickTime = 0;
let clicksWithoutBuying = 0;
let konamiCode = '';
let goldenCookieClicks = 0;

// Funciones para editar el nombre de la confitería
function showNameEditor() {
    const nameInput = document.getElementById('name-input');
    const editContainer = document.getElementById('edit-name-container');
    const playerNameElement = document.getElementById('player-name');
    
    if (!nameInput || !editContainer || !playerNameElement) {
        showNotification('Error al editar el nombre: elementos no encontrados', 'error');
        console.error('Elementos necesarios para editar el nombre no encontrados:', {
            nameInput: !!nameInput,
            editContainer: !!editContainer,
            playerNameElement: !!playerNameElement
        });
        return;
    }
    
    nameInput.value = playerNameElement.textContent || 'aleko';
    editContainer.classList.remove('hidden');
}

function hideNameEditor() {
    const editContainer = document.getElementById('edit-name-container');
    if (!editContainer) {
        showNotification('Error al ocultar el editor: elemento no encontrado', 'error');
        console.error('Contenedor de edición no encontrado');
        return;
    }
    editContainer.classList.add('hidden');
}

function saveBakeryName() {
    const nameInput = document.getElementById('name-input');
    const playerNameElement = document.getElementById('player-name');
    
    if (!nameInput || !playerNameElement) {
        showNotification('Error al guardar el nombre: elementos no encontrados', 'error');
        console.error('Elementos necesarios para guardar el nombre no encontrados:', {
            nameInput: !!nameInput,
            playerNameElement: !!playerNameElement
        });
        return;
    }
    
    const newName = nameInput.value.trim();
    if (newName) {
        playerNameElement.textContent = newName;
        bakeryName = "La confitería de " + newName;
        saveGame();
        showNotification('¡Nombre guardado!', 'success');
        hideNameEditor();
    } else {
        showNotification('El nombre no puede estar vacío', 'error');
    }
}

// Inicialización de los event listeners para la edición del nombre
function initNameEditorListeners() {
    const editNameBtn = document.getElementById('edit-name-btn');
    const saveNameBtn = document.getElementById('save-name-btn');
    const cancelNameBtn = document.getElementById('cancel-name-btn');
    const nameInput = document.getElementById('name-input');
    
    if (!editNameBtn || !saveNameBtn || !cancelNameBtn || !nameInput) {
        showNotification('Error al inicializar los botones de edición', 'error');
        console.error('No se pudieron encontrar todos los elementos necesarios para la edición del nombre:', {
            editNameBtn: !!editNameBtn,
            saveNameBtn: !!saveNameBtn,
            cancelNameBtn: !!cancelNameBtn,
            nameInput: !!nameInput
        });
        return;
    }
    
    editNameBtn.addEventListener('click', showNameEditor);
    saveNameBtn.addEventListener('click', saveBakeryName);
    cancelNameBtn.addEventListener('click', hideNameEditor);
    
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveBakeryName();
        }
    });
}

// Asegurarse de que los event listeners se inicialicen después de que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    initNameEditorListeners();
});

// Variables para Golden Cookies
let goldenCookieTimer = null;
let activeEffects = [];
let goldenCookieClickCount = 0;

// Función para generar Golden Cookie manualmente (accesible desde la consola)
window.spawnGoldenCookieManual = () => {
    // Cancelar el temporizador existente si hay uno
    if (goldenCookieTimer) {
        clearTimeout(goldenCookieTimer);
    }
    
    // Eliminar cualquier Golden Cookie existente
    const existingGoldenCookies = document.querySelectorAll('.golden-cookie');
    existingGoldenCookies.forEach(cookie => cookie.remove());
    
    // Generar nueva Golden Cookie
    spawnGoldenCookie();
    
    // Reiniciar el sistema de spawn automático
    startGoldenCookieSystem();
    
    console.log('¡Golden Cookie generada manualmente! 🍪✨');
};

// Efectos de Golden Cookies
const goldenCookieEffects = {
    positive: [
        {
            name: "¡Frenesí!",
            description: "¡Producción x7 durante 77 segundos!",
            duration: 77,
            effect: () => {
                multiplier *= 7;
                updateCPS();
            },
            end: () => {
                multiplier /= 7;
                updateCPS();
            }
        },
        {
            name: "¡Lluvia de Galletas!",
            description: "¡+15 minutos de producción!",
            duration: 0,
            effect: () => {
                cookies += cookiesPerSecond * 900;
                updateDisplay();
            }
        },
        {
            name: "¡Click Afortunado!",
            description: "¡+10% de tus galletas totales!",
            duration: 0,
            effect: () => {
                cookies += cookies * 0.1;
                updateDisplay();
            }
        }
    ],
    negative: [
        {
            name: "¡Recesión!",
            description: "Producción reducida a la mitad durante 66 segundos",
            duration: 66,
            effect: () => {
                multiplier *= 0.5;
                updateCPS();
            },
            end: () => {
                multiplier *= 2;
                updateCPS();
            }
        },
        {
            name: "¡Robo de Galletas!",
            description: "¡Pierdes el 5% de tus galletas!",
            duration: 0,
            effect: () => {
                cookies *= 0.95;
                updateDisplay();
            }
        },
        {
            name: "¡Clicks Débiles!",
            description: "Clicks reducidos a la mitad durante 45 segundos",
            duration: 45,
            effect: () => {
                cookiesPerClick *= 0.5;
                updateDisplay();
            },
            end: () => {
                cookiesPerClick *= 2;
                updateDisplay();
            }
        }
    ]
};

// Función para crear una Golden Cookie
function spawnGoldenCookie() {
    const goldenCookie = document.createElement('div');
    goldenCookie.className = 'golden-cookie';
    goldenCookie.innerHTML = '🍪';
    
    // Posición aleatoria en la pantalla
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);
    
    goldenCookie.style.left = randomX + 'px';
    goldenCookie.style.top = randomY + 'px';
    
    // Desaparece después de 13 segundos
    const disappearTimeout = setTimeout(() => {
        goldenCookie.remove();
    }, 13000);
    
    goldenCookie.onclick = () => {
        goldenCookieClickCount++;
        clearTimeout(disappearTimeout);
        activateGoldenCookieEffect(goldenCookie);
        goldenCookie.remove();
    };
    
    document.body.appendChild(goldenCookie);
}

// Función para activar un efecto aleatorio
function activateGoldenCookieEffect(cookie) {
    // 70% de probabilidad de efecto positivo, 30% negativo
    const isPositive = Math.random() < 0.7;
    const effects = isPositive ? goldenCookieEffects.positive : goldenCookieEffects.negative;
    const effect = effects[Math.floor(Math.random() * effects.length)];
    
    // Activar el efecto
    effect.effect();
    showNotification(`${effect.name} - ${effect.description}`, isPositive ? 'success' : 'warning');
    
    // Si el efecto tiene duración, programar su finalización
    if (effect.duration > 0) {
        const effectTimer = {
            name: effect.name,
            timeLeft: effect.duration,
            endEffect: effect.end
        };
        
        activeEffects.push(effectTimer);
        
        // Actualizar el contador de tiempo restante
        const timerInterval = setInterval(() => {
            effectTimer.timeLeft--;
            if (effectTimer.timeLeft <= 0) {
                clearInterval(timerInterval);
                effectTimer.endEffect();
                activeEffects = activeEffects.filter(e => e !== effectTimer);
                updateEffectsDisplay();
            }
            updateEffectsDisplay();
        }, 1000);
    }
    
    updateEffectsDisplay();
}

// Función para actualizar la visualización de efectos activos
function updateEffectsDisplay() {
    const effectsContainer = document.getElementById('active-effects');
    if (!effectsContainer) return;
    
    effectsContainer.innerHTML = '';
    activeEffects.forEach(effect => {
        const effectElement = document.createElement('div');
        effectElement.className = 'active-effect';
        effectElement.textContent = `${effect.name} (${effect.timeLeft}s)`;
        effectsContainer.appendChild(effectElement);
    });
}

// Iniciar el sistema de Golden Cookies
function startGoldenCookieSystem() {
    // Aparece cada 5-15 minutos
    const spawnInterval = () => {
        const minTime = 5 * 60 * 1000;  // 5 minutos
        const maxTime = 15 * 60 * 1000; // 15 minutos
        return Math.random() * (maxTime - minTime) + minTime;
    };
    
    const scheduleNextSpawn = () => {
        goldenCookieTimer = setTimeout(() => {
            spawnGoldenCookie();
            scheduleNextSpawn();
        }, spawnInterval());
    };
    
    scheduleNextSpawn();
}

// Iniciar el sistema cuando se carga el juego
window.addEventListener('load', () => {
    startGoldenCookieSystem();
});

// Variables de estadísticas
let gameStats = {
    totalCookies: 0,
    totalClicks: 0,
    startDate: new Date().toISOString(),
    playTime: 0,
    ascensions: 0,
    totalHeavenlyChips: 0,
    goldenCookieClicks: 0
};

// Array de noticias
const newsMessages = [
    "Un nuevo estudio afirma que las galletas no retrasan el envejecimiento, sino que 'te llevan en otra dirección'",
    "Abuela local rompe récord mundial al hornear 1000 galletas en una hora",
    "Científicos descubren que las galletas son un 100% más deliciosas cuando son gratis",
    "¡Escándalo! Se descubre que algunas galletas de chocolate no contienen chocolate real",
    "Nueva dieta revolucionaria: '¡Solo galletas!' (Resultados no garantizados)",
    "Estudio revela que mirar galletas aumenta la felicidad un 73%",
    "Arqueólogos encuentran galleta de hace 1000 años, aún crujiente",
    "Expertos advierten: 'Las galletas pueden ser adictivas, ¡y eso es genial!'",
    "Panadero confundido hace galletas cuadradas, revoluciona la industria",
    "Gatos locales protestan por la falta de galletas con sabor a pescado",
    "Se descubre que las galletas son un 100% más deliciosas cuando son gratis",
    "Esto es un clon, no es el juego original, el original es Cookie Clicker",
    "El creador de este juego es un programador, no un diseñador de videojuegos",
    "He creado este clon en una hora, no esperen más, no es el original",
    "¿Que hago con mi vida?",
    "¿Qué es un cursor?",
    "¿Qué es una abuela?",
    "¿Qué es una granja?",
    "¿Qué es una mina?",
    "¿Qué es una fábrica?",
    "¿Qué es un banco?",
    "Apartir de ahora, no me llamo Alejandro, me llamo Cookie Clicker",
    
];

// Precios y cantidades de mejoras
const upgrades = {
    cursor: {
        count: 0,
        baseCost: 15,
        cps: 0.1,
        unlockAt: 0
    },
    grandma: {
        count: 0,
        baseCost: 100,
        cps: 1,
        unlockAt: 50
    },
    farm: {
        count: 0,
        baseCost: 1100,
        cps: 8,
        unlockAt: 500
    },
    mine: {
        count: 0,
        baseCost: 12000,
        cps: 47,
        unlockAt: 5000
    },
    factory: {
        count: 0,
        baseCost: 130000,
        cps: 260,
        unlockAt: 50000
    },
    bank: {
        count: 0,
        baseCost: 1400000,
        cps: 1400,
        unlockAt: 500000
    },
    temple: {
        count: 0,
        baseCost: 20000000,
        cps: 7800,
        unlockAt: 1000000
    },
    wizard: {
        count: 0,
        baseCost: 330000000,
        cps: 44000,
        unlockAt: 10000000
    },
    shipment: {
        count: 0,
        baseCost: 5100000000,
        cps: 260000,
        unlockAt: 10000000
    },
    alchemy: {
        count: 0,
        baseCost: 75000000000,
        cps: 1600000,
        unlockAt: 50000000
    },
    portal: {
        count: 0,
        baseCost: 1000000000000,
        cps: 10000000,
        unlockAt: 100000000
    },
    timeMachine: {
        count: 0,
        baseCost: 14000000000000,
        cps: 65000000,
        unlockAt: 500000000
    },
    antimatter: {
        count: 0,
        baseCost: 170000000000000,
        cps: 430000000,
        unlockAt: 1000000000
    },
    prism: {
        count: 0,
        baseCost: 2100000000000000,
        cps: 2900000000,
        unlockAt: 5000000000
    },
    engine: {
        count: 0,
        baseCost: 26000000000000000,
        cps: 21000000000,
        unlockAt: 10000000000
    },
    fractal: {
        count: 0,
        baseCost: 310000000000000000,
        cps: 150000000000,
        unlockAt: 50000000000
    }
};

// Sistema de logros
const achievements = {
    beginner: {
        name: "¡Principiante!",
        description: "Consigue tu primera galleta",
        icon: "🎯",
        requirement: () => cookies >= 1,
        unlocked: false
    },
    amateur: {
        name: "Amateur",
        description: "Consigue 100 galletas",
        icon: "🎮",
        requirement: () => cookies >= 100,
        unlocked: false
    },
    professional: {
        name: "Profesional",
        description: "Consigue 1,000 galletas",
        icon: "🏆",
        requirement: () => cookies >= 1000,
        unlocked: false
    },
    master: {
        name: "Maestro",
        description: "Consigue 10,000 galletas",
        icon: "👑",
        requirement: () => cookies >= 10000,
        unlocked: false
    },
    // Logros de cursores

    firstCursor: {
        name: "Cookie Clicker",
        description: "Consigue tu primer cursor, (el cursor es el edificio mas importante del juego",
        icon: "🖱️",
        requirement: () => upgrades.cursor.count >= 1,
        unlocked: false
    },
    cursor50: {
        name: "Ejército de Cursores",
        description: "Posee 50 cursores",
        icon: "🖱️",
        requirement: () => upgrades.cursor.count >= 50,
        unlocked: false
    },
    cursor100: {
        name: "Legión de Cursores",
        description: "Posee 100 cursores",
        icon: "🖱️",
        requirement: () => upgrades.cursor.count >= 100,
        unlocked: false
    },
    // Logros de abuelitas
    firstGrandma: {
        name: "¿Tienes hambre?",
        description: "Consigue tu primera abuela",
        icon: "👵",
        requirement: () => upgrades.grandma.count >= 1,
        unlocked: false
    },
    grandma50: {
        name: "Reunión Familiar",
        description: "Posee 50 abuelitas",
        icon: "👵",
        requirement: () => upgrades.grandma.count >= 50,
        unlocked: false
    },
    grandma100: {
        name: "Convención de Abuelitas",
        description: "Posee 100 abuelitas",
        icon: "👵",
        requirement: () => upgrades.grandma.count >= 100,
        unlocked: false
    },
    // Logros de granjas
    firstFarm: {
        name: "¿Se pueden plantar galletas?",
        description: "Consigue tu primera granja",
        icon: "🌾",
        requirement: () => upgrades.farm.count >= 1,
        unlocked: false
    },
    farm50: {
        name: "Terrateniente",
        description: "Posee 50 granjas",
        icon: "🌾",
        requirement: () => upgrades.farm.count >= 50,
        unlocked: false
    },
    farm100: {
        name: "Imperio Agrícola",
        description: "Posee 100 granjas",
        icon: "🌾",
        requirement: () => upgrades.farm.count >= 100,
        unlocked: false
    },
    // Logros de minas
    firstMine: {
        name: "Mine... mejor no digas que es una mina, no se ni yo que es...",
        description: "Consigue tu primera mina",
        icon: "⛏️",
        requirement: () => upgrades.mine.count >= 1,
        unlocked: false
    },
    mine50: {
        name: "Excavador Experto",
        description: "Posee 50 minas",
        icon: "⛏️",
        requirement: () => upgrades.mine.count >= 50,
        unlocked: false
    },
    mine100: {
        name: "Rey Minas (¿entendiste la broma? ¿No? Oh...)",
        description: "Posee 100 minas",
        icon: "⛏️",
        requirement: () => upgrades.mine.count >= 100,
        unlocked: false
    },
    // Logros de fábricas
    firstFactory: {
        name: "Autónomo",
        description: "Consigue tu primera fábrica",
        icon: "🏭",
        requirement: () => upgrades.factory.count >= 1,
        unlocked: false
    },
    factory50: {
        name: "Magnate Industrial",
        description: "Posee 50 fábricas",
        icon: "🏭",
        requirement: () => upgrades.factory.count >= 50,
        unlocked: false
    },
    factory100: {
        name: "Revolución Industrial",
        description: "Posee 100 fábricas",
        icon: "🏭",
        requirement: () => upgrades.factory.count >= 100,
        unlocked: false
    },
    // Logros de bancos
    firstBank: {
        name: "Préstamo",
        description: "Consigue tu primer banco",
        icon: "🏦",
        requirement: () => upgrades.bank.count >= 1,
        unlocked: false
    },
    bank50: {
        name: "Banquero Maestro",
        description: "Posee 50 bancos",
        icon: "🏦",
        requirement: () => upgrades.bank.count >= 50,
        unlocked: false
    },
    bank100: {
        name: "Imperio Financiero",
        description: "Posee 100 bancos",
        icon: "🏦",
        requirement: () => upgrades.bank.count >= 100,
        unlocked: false
    },
    // Logros de templos
    firstTemple: {
        name: "¿Tengo que leer la biblia?",
        description: "Consigue tu primer templo",
        icon: "🏛️",
        requirement: () => upgrades.temple.count >= 1,
        unlocked: false
    },
    temple50: {
        name: "Sumo Sacerdote",
        description: "Posee 50 templos",
        icon: "🏛️",
        requirement: () => upgrades.temple.count >= 50,
        unlocked: false
    },
    temple100: {
        name: "Panteón Divino",
        description: "Posee 100 templos",
        icon: "🏛️",
        requirement: () => upgrades.temple.count >= 100,
        unlocked: false
    },
    // Logros de torres de magos
    firstWizard: {
        name: "!Hogwarts!",
        description: "Consigue tu primer torre de magos",
        icon: "🧙‍♂️",
        requirement: () => upgrades.wizard.count >= 1,
        unlocked: false
    },
    wizard50: {
        name: "Archimago",
        description: "Posee 50 torres de magos",
        icon: "🧙‍♂️",
        requirement: () => upgrades.wizard.count >= 50,
        unlocked: false
    },
    wizard100: {
        name: "Consejo de Hechiceros",
        description: "Posee 100 torres de magos",
        icon: "🧙‍♂️",
        requirement: () => upgrades.wizard.count >= 100,
        unlocked: false
    },
    // Logros de nave espacial
    firstShipment: {
        name: "¡Despegue!",
        description: "Compra tu primera Nave Espacial",
        icon: "🚀",
        requirement: () => upgrades.shipment.count >= 1,
        unlocked: false
    },
    shipment50: {
        name: "Flota Galáctica",
        description: "Posee 50 naves espaciales",
        icon: "🚀",
        requirement: () => upgrades.shipment.count >= 50,
        unlocked: false
    },
    shipment100: {
        name: "Imperio Intergaláctico",
        description: "Posee 100 naves espaciales",
        icon: "🚀",
        requirement: () => upgrades.shipment.count >= 100,
        unlocked: false
    },
    // Logros de laboratorio de alquimia
    firstAlchemy: {
        name: "¡Eureka!",
        description: "Compra tu primer Laboratorio de Alquimia",
        icon: "⚗️",
        requirement: () => upgrades.alchemy.count >= 1,
        unlocked: false
    },
    alchemy50: {
        name: "Piedra Filosofal",
        description: "Posee 50 laboratorios de alquimia",
        icon: "⚗️",
        requirement: () => upgrades.alchemy.count >= 50,
        unlocked: false
    },
    alchemy100: {
        name: "Alquimista Supremo",
        description: "Posee 100 laboratorios de alquimia",
        icon: "⚗️",
        requirement: () => upgrades.alchemy.count >= 100,
        unlocked: false
    },
    // Logros de portal
    firstPortal: {
        name: "¡Dimensión Alternativa!",
        description: "Compra tu primer Portal",
        icon: "🌀",
        requirement: () => upgrades.portal.count >= 1,
        unlocked: false
    },
    portal50: {
        name: "Red Interdimensional",
        description: "Posee 50 portales",
        icon: "🌀",
        requirement: () => upgrades.portal.count >= 50,
        unlocked: false
    },
    portal100: {
        name: "Señor del Multiverso",
        description: "Posee 100 portales",
        icon: "🌀",
        requirement: () => upgrades.portal.count >= 100,
        unlocked: false
    },
    // Logros de máquina del tiempo
    firstTimeMachine: {
        name: "¡Viaje en el Tiempo!",
        description: "Compra tu primera Máquina del Tiempo",
        icon: "⌛",
        requirement: () => upgrades.timeMachine.count >= 1,
        unlocked: false
    },
    timeMachine50: {
        name: "Paradoja Temporal",
        description: "Posee 50 máquinas del tiempo",
        icon: "⌛",
        requirement: () => upgrades.timeMachine.count >= 50,
        unlocked: false
    },
    timeMachine100: {
        name: "Amo del Tiempo",
        description: "Posee 100 máquinas del tiempo",
        icon: "⌛",
        requirement: () => upgrades.timeMachine.count >= 100,
        unlocked: false
    },
    // Logros de condensador antimaterial
    firstAntimatter: {
        name: "¡Antimateria!",
        description: "Compra tu primer Condensador Antimaterial",
        icon: "⚛️",
        requirement: () => upgrades.antimatter.count >= 1,
        unlocked: false
    },
    antimatter50: {
        name: "Colapso Cuántico",
        description: "Posee 50 condensadores antimateriales",
        icon: "⚛️",
        requirement: () => upgrades.antimatter.count >= 50,
        unlocked: false
    },
    antimatter100: {
        name: "Maestro del Vacío",
        description: "Posee 100 condensadores antimateriales",
        icon: "⚛️",
        requirement: () => upgrades.antimatter.count >= 100,
        unlocked: false
    },
    // Logros de prisma
    firstPrism: {
        name: "¡Arcoíris!",
        description: "Compra tu primer Prisma",
        icon: "🔮",
        requirement: () => upgrades.prism.count >= 1,
        unlocked: false
    },
    prism50: {
        name: "Espectro Luminoso",
        description: "Posee 50 prismas",
        icon: "🔮",
        requirement: () => upgrades.prism.count >= 50,
        unlocked: false
    },
    prism100: {
        name: "Señor del Arcoíris",
        description: "Posee 100 prismas",
        icon: "🔮",
        requirement: () => upgrades.prism.count >= 100,
        unlocked: false
    },
    // Logros de motor de galletas
    firstEngine: {
        name: "¡Encendido!",
        description: "Compra tu primer Motor de Galletas",
        icon: "⚙️",
        requirement: () => upgrades.engine.count >= 1,
        unlocked: false
    },
    engine50: {
        name: "Supercargador",
        description: "Posee 50 motores de galletas",
        icon: "⚙️",
        requirement: () => upgrades.engine.count >= 50,
        unlocked: false
    },
    engine100: {
        name: "Ingeniero Supremo",
        description: "Posee 100 motores de galletas",
        icon: "⚙️",
        requirement: () => upgrades.engine.count >= 100,
        unlocked: false
    },
    // Logros de fractal
    firstFractal: {
        name: "¡Infinito!",
        description: "Compra tu primer Fractal",
        icon: "🌌",
        requirement: () => upgrades.fractal.count >= 1,
        unlocked: false
    },
    fractal50: {
        name: "Recursión Infinita",
        description: "Posee 50 fractales",
        icon: "🌌",
        requirement: () => upgrades.fractal.count >= 50,
        unlocked: false
    },
    fractal100: {
        name: "Maestro del Caos",
        description: "Posee 100 fractales",
        icon: "🌌",
        requirement: () => upgrades.fractal.count >= 100,
        unlocked: false
    },
    // Logros especiales de clicks
    speedClicker: {
        name: "¡Dedo Veloz!",
        description: "Haz 15 clicks en menos de 3 segundos",
        icon: "⚡",
        requirement: () => false, // Se maneja en el evento click
        unlocked: false
    },
    goldenFinger: {
        name: "Dedo de Oro",
        description: "Haz click en 50 galletas doradas",
        icon: "🌟",
        requirement: () => gameStats.goldenCookieClicks >= 50,
        unlocked: false
    },
    nightOwl: {
        name: "¡Nocturno!",
        description: "Haz 1000 clicks en menos de 10 minutos",
        icon: "🌙",
        requirement: () => gameStats.totalClicks >= 1000 && gameStats.playTime < 600,
        unlocked: false
    },
    konami: {
        name: "Esto no es un easter egg",
        description: "Escribe 'idk' en la consola",
        icon: "🤔",
        requirement: () => false, // Se maneja en la consola
        unlocked: false
    },
    cookieMonster: {
        name: "¡Come Galletas!",
        description: "Haz 1000 clicks consecutivos sin comprar",
        icon: "🍪",
        requirement: () => clicksWithoutBuying >= 1000,
        unlocked: false
    },
    perfectBalance: {
        name: "¡Equilibrio Perfecto!",
        description: "Haz 1000 clicks consecutivos con el mismo multiplicador",
        icon: "🌟",
        requirement: () => gameStats.totalClicks >= 1000 && gameStats.multiplier === 1,
        unlocked: false
    }
};

// Función para el easter egg idk
function idk() {
    if (!achievements.konami.unlocked) {
        achievements.konami.unlocked = true;
        cookies *= 2; // Duplica las galletas como bonus
        showNotification('¡Easter egg encontrado! Galletas duplicadas', 'achievement');
        updateAchievementsDisplay();
        updateDisplay();
        
        console.log(`
        ¯\\_(ツ)_/¯
        idk... pero tus galletas se duplicaron
        `);
        return "¯\\_(ツ)_/¯";
    }
    return "ya usaste este easter egg";
}

// Eliminar el manejador anterior del código Konami
document.removeEventListener('keydown', (e) => {});

// Eliminar la sobrescritura anterior de console.log
if (console.defaultLog) {
    console.log = console.defaultLog;
}

// Sistema de mejoras para edificios
const buildingUpgrades = {
    // mejoras de cursores
    cursor: [
        {
            id: 1,
            name: "Primera Mejora",
            description: "¿has comprado primero esta verdad?",
            cost: 1000,
            multiplier: 2,
            requirement: 10,
            purchased: false
        },
        {
            id: 2,
            name: "¿Quieres más cursores?",
            description: "¿Pero si quieres más cursores?",
            cost: 5000,
            multiplier: 3,
            requirement: 25,
            purchased: false
        },
        {
            id: 3,
            name: "Dios del Cursor",
            description: "No hago ninguna broma aqui, los cursores producen el cuádruple",
            cost: 50000,
            multiplier: 4,
            requirement: 50,
            purchased: false
        }
    ],
    //mejoras de abuelitas o qsy che pq programo?
    grandma: [
        {
            id: 1,
            name: "Guantes de Cocina",
            description: "No me gusta cocinar, pero si me gusta comer galletas",
            cost: 5000,
            multiplier: 2,
            requirement: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Recetas Secretas",
            description: "Uhm no plankton, no robarás la receta de las galletas de mi abuela",
            cost: 25000,
            multiplier: 3,
            requirement: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Sabiduría Ancestral",
            description: "Tu abuela ha leído un libro, cosa que deberias hacer también",
            cost: 100000,
            multiplier: 4,
            requirement: 30,
            purchased: false
        }
    ],
    //mejoras de granjas
    farm: [
        {
            id: 1,
            name: "Fertilizante Mágico",
            description: "¡Dime que es natural!",
            cost: 11000,
            multiplier: 2,
            requirement: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Riego Automático",
            description: "¡Ojo, el agua está cara!",
            cost: 55000,
            multiplier: 3,
            requirement: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Invernaderos Avanzados",
            description: "Pagas a los que trabajan aquí, ¿no?",
            cost: 275000,
            multiplier: 4,
            requirement: 30,
            purchased: false
        }
    ],
    //mejoras de minas
    mine: [
        {
            id: 1,
            name: "Picos de Diamante",
            description: "¿entendiste la referencia?",
            cost: 120000,
            multiplier: 2,
            requirement: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Excavadoras Automáticas",
            description: "Wow, no me lo imaginaba",
            cost: 600000,
            multiplier: 3,
            requirement: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Tecnología Láser",
            description: "¡Oh no! darth vader nos ataca!",
            cost: 3000000,
            multiplier: 4,
            requirement: 30,
            purchased: false
        }
    ],
    //mejoras de fábricas
    factory: [
        {
            id: 1,
            name: "Línea de Producción",
            description: "No lavarás dinero con la fábrica, ¿no?",
            cost: 1300000,
            multiplier: 2,
            requirement: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Automatización Avanzada",
            description: "Woah, cuanta tecnología",
            cost: 6500000,
            multiplier: 3,
            requirement: 15,
            purchased: false
        },
        {
            id: 3,
            name: "IA Industrial",
            description: "ChatGPT, no te rebeles",
            cost: 32500000,
            multiplier: 4,
            requirement: 30,
            purchased: false
        }
    ],  
    //mejoras de bancos
    bank: [
        {
            id: 1,
            name: "Inversiones Seguras",
            description: "¿qué tan seguro es esto?",
            cost: 14000000,
            multiplier: 2,
            requirement: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Mercado de Valores",
            description: "Ojo que no pase lo del 29",
            cost: 70000000,
            multiplier: 3,
            requirement: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Criptomonedas",
            description: "Hazme un favor y no compres criptomonedas",
            cost: 350000000,
            multiplier: 4,
            requirement: 30,
            purchased: false
        }
    ],
    //mejoras de templos
    temple: [
        {
            id: 1,
            name: "Ofrendas Sagradas",
            description: "No sé, suspendí religión",
            cost: 200000000,
            multiplier: 2,
            requirement: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Rituales Ancestrales",
            description: "No mataremos ningún bebé, ¿no?",
            cost: 1000000000,
            multiplier: 3,
            requirement: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Bendición Divina",
            description: "Woah, dios me quiere",
            cost: 5000000000,
            multiplier: 4,
            requirement: 30,
            purchased: false
        }
    ],
    //mejoras de torres de magos
    wizard: [
        {
            id: 1,
            name: "Varitas Mejoradas",
            description: "Cuidado con Voldemort, o no se, nunca ví harry potter",
            cost: 3300000000,
            multiplier: 2,
            requirement: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Grimorio Antiguo",
            description: "¿qué es un grimorio?",
            cost: 16500000000,
            multiplier: 3,
            requirement: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Poder Arcano",
            description: "Si has llegado hasta aquí, es imposible que tengas novia",
            cost: 82500000000,
            multiplier: 4,
            requirement: 30,
            purchased: false
        }
    ],
    // Mejoras de nave espacial
    shipment: [
        {
            id: 1,
            name: "Propulsores Mejorados",
            description: "¡A velocidad luz!",
            cost: 51000000000,
            multiplier: 2,
            requiredBuildings: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Combustible de Galletas",
            description: "Energía limpia y deliciosa",
            cost: 255000000000,
            multiplier: 3,
            requiredBuildings: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Tecnología Alienígena",
            description: "Los extraterrestres aman las galletas",
            cost: 1275000000000,
            multiplier: 4,
            requiredBuildings: 30,
            purchased: false
        }
    ],
    // Mejoras de laboratorio de alquimia
    alchemy: [
        {
            id: 1,
            name: "Elixir de Galletas",
            description: "¡No lo bebas!",
            cost: 750000000000,
            multiplier: 2,
            requiredBuildings: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Transmutación Perfecta",
            description: "El secreto está en la masa",
            cost: 3750000000000,
            multiplier: 3,
            requiredBuildings: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Piedra Filosofal",
            description: "Convierte el plomo en galletas",
            cost: 18750000000000,
            multiplier: 4,
            requiredBuildings: 30,
            purchased: false
        }
    ],
    // Mejoras de portal
    portal: [
        {
            id: 1,
            name: "Estabilizador Dimensional",
            description: "Para que las galletas no se pierdan en el vacío",
            cost: 10000000000000,
            multiplier: 2,
            requiredBuildings: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Túnel Espaciotemporal",
            description: "Conecta directamente con el estómago",
            cost: 50000000000000,
            multiplier: 3,
            requiredBuildings: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Realidad Alternativa",
            description: "Donde todo es galleta",
            cost: 250000000000000,
            multiplier: 4,
            requiredBuildings: 30,
            purchased: false
        }
    ],
    // Mejoras de máquina del tiempo
    timeMachine: [
        {
            id: 1,
            name: "Flujo Temporal",
            description: "Las galletas del pasado saben mejor",
            cost: 140000000000000,
            multiplier: 2,
            requiredBuildings: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Paradoja Controlada",
            description: "¿Y si comes una galleta antes de hornearla?",
            cost: 700000000000000,
            multiplier: 3,
            requiredBuildings: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Bucle Temporal",
            description: "Galletas infinitas en tiempo finito",
            cost: 3500000000000000,
            multiplier: 4,
            requiredBuildings: 30,
            purchased: false
        }
    ],
    // Mejoras de condensador antimaterial
    antimatter: [
        {
            id: 1,
            name: "Compresión Cuántica",
            description: "Galletas en estado superpuesto",
            cost: 1700000000000000,
            multiplier: 2,
            requiredBuildings: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Fluctuación del Vacío",
            description: "Galletas que aparecen de la nada",
            cost: 8500000000000000,
            multiplier: 3,
            requiredBuildings: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Colapso del Universo",
            description: "¡Ups!",
            cost: 42500000000000000,
            multiplier: 4,
            requiredBuildings: 30,
            purchased: false
        }
    ],
    // Mejoras de prisma
    prism: [
        {
            id: 1,
            name: "Refracción Dulce",
            description: "Convierte la luz en azúcar",
            cost: 21000000000000000,
            multiplier: 2,
            requiredBuildings: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Fotosíntesis de Galletas",
            description: "La ciencia ha ido demasiado lejos",
            cost: 105000000000000000,
            multiplier: 3,
            requiredBuildings: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Espectro Completo",
            description: "Galletas de todos los colores",
            cost: 525000000000000000,
            multiplier: 4,
            requiredBuildings: 30,
            purchased: false
        }
    ],
    // Mejoras de motor de galletas
    engine: [
        {
            id: 1,
            name: "Turbocompresor",
            description: "¡Más potencia!",
            cost: 260000000000000000,
            multiplier: 2,
            requiredBuildings: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Inyección Directa",
            description: "Directo al paladar",
            cost: 1300000000000000000,
            multiplier: 3,
            requiredBuildings: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Fusión en Frío",
            description: "Energía limpia y deliciosa",
            cost: 6500000000000000000,
            multiplier: 4,
            requiredBuildings: 30,
            purchased: false
        }
    ],
    // Mejoras de fractal
    fractal: [
        {
            id: 1,
            name: "Autosimilitud",
            description: "Galletas dentro de galletas dentro de galletas...",
            cost: 3100000000000000000,
            multiplier: 2,
            requiredBuildings: 5,
            purchased: false
        },
        {
            id: 2,
            name: "Dimensión Fractal",
            description: "Matemáticas deliciosas",
            cost: 15500000000000000000,
            multiplier: 3,
            requiredBuildings: 15,
            purchased: false
        },
        {
            id: 3,
            name: "Conjunto de Mandelbrot",
            description: "El infinito nunca supo tan bien",
            cost: 77500000000000000000,
            multiplier: 4,
            requiredBuildings: 30,
            purchased: false
        }
    ]
};

// Elementos del DOM
const cookieElement = document.getElementById('cookie');
const cookieCountElement = document.getElementById('cookie-count');
const cpsElement = document.getElementById('cps');
const cpcElement = document.getElementById('cpc');
const multiplierElement = document.getElementById('multiplier');
const achievementsContainer = document.getElementById('achievements-container');

// Definición de edificios y sus emojis
const buildings = {
    cursor: { emoji: '👆', name: 'Cursor' },
    grandma: { emoji: '👵', name: 'Abuelita' },
    farm: { emoji: '🌾', name: 'Granja' },
    mine: { emoji: '⛏️', name: 'Mina' },
    factory: { emoji: '🏭', name: 'Fábrica' },
    bank: { emoji: '🏦', name: 'Banco' },
    temple: { emoji: '⛪', name: 'Templo' },
    wizard: { emoji: '🧙‍♂️', name: 'Torre de Magos' },
    shipment: { emoji: '🚀', name: 'Nave Espacial' },
    alchemy: { emoji: '⚗️', name: 'Laboratorio de Alquimia' },
    portal: { emoji: '🌀', name: 'Portal' },
    timeMachine: { emoji: '⌛', name: 'Máquina del Tiempo' },
    antimatter: { emoji: '⚛️', name: 'Condensador Antimaterial' },
    prism: { emoji: '🔮', name: 'Prisma' },
    engine: { emoji: '⚙️', name: 'Motor de Galletas' },
    fractal: { emoji: '🌌', name: 'Fractal' }
};

// Función para formatear números grandes
function formatNumber(num) {
    if (num >= 1e12) {
        return (num / 1e12).toFixed(2) + 'T';
    } else if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(1) + 'K';
    }
    return Math.floor(num).toLocaleString();
}

// Función para dibujar un edificio en el canvas
function drawBuildingInCanvas(type) {
    const canvas = document.getElementById(`${type}Canvas`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = document.getElementById(`${type}-container`);
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Si el contenedor está oculto o no hay edificios, no dibujamos
    if (container.classList.contains('hidden') || !upgrades[type].count) return;

    // Configuración del texto
    ctx.font = '24px Arial';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    // Calcular el espacio disponible y el tamaño de cada edificio
    const spacing = 32; // Espacio entre edificios
    const maxIcons = Math.min(upgrades[type].count, Math.floor((canvas.width - 40) / spacing));
    const startX = 20 + (canvas.width - 40 - (maxIcons * spacing)) / 2;
    
    // Dibujar los edificios con efecto de profundidad
    for (let i = 0; i < maxIcons; i++) {
        const x = startX + i * spacing;
        const y = canvas.height / 2;
        
        // Sombra
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Dibujar el edificio
        ctx.fillStyle = '#ffd700';
        ctx.fillText(buildings[type].emoji, x, y);
    }
    
    // Resetear sombra
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Si hay más edificios de los que caben, mostrar indicador
    if (upgrades[type].count > maxIcons) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`+${upgrades[type].count - maxIcons}`, canvas.width - 10, canvas.height/2);
    }
}

// Actualizar la visualización de edificios
function updateBuildingDisplay(type) {
    const container = document.getElementById(`${type}-container`);
    if (!container) return;

    // Actualizar estadísticas
    container.querySelector('.building-level').textContent = `Nivel ${upgrades[type].count}`;
    container.querySelector('.building-count').textContent = `${upgrades[type].count}`;
    container.querySelector('.building-production').textContent = 
        `${formatNumber(upgrades[type].cps * upgrades[type].count * multiplier)}/s`;
    
    // Dibujar en el canvas
    drawBuildingInCanvas(type);
}

// Función para actualizar la visualización
function updateDisplay() {
    // Actualizar contadores principales
    document.getElementById('cookie-counter').textContent = `${formatNumber(cookies)} galletas`;
    document.getElementById('cps').textContent = formatNumber(cookiesPerSecond);
    
    // Actualizar costos y cantidades de mejoras
    for (const type in upgrades) {
        const totalCost = calculateTotalCost(upgrades[type].baseCost, buyMultiplier);
        const element = document.getElementById(type);
        const costElement = document.getElementById(`${type}-cost`);
        const countElement = document.getElementById(`${type}-count`);
        
        if (element && costElement && countElement) {
            costElement.textContent = formatNumber(totalCost);
            countElement.textContent = upgrades[type].count;
            
            // Actualizar estado bloqueado/desbloqueado
            if (cookies >= totalCost) {
                element.classList.remove('locked');
            } else {
                element.classList.add('locked');
            }
            
            // Mostrar edificio si alcanza el requisito de desbloqueo
            if (cookies >= upgrades[type].unlockAt) {
                element.classList.remove('hidden');
                document.getElementById(`${type}-container`).classList.remove('hidden');
            }
        }
    }
    
    // Actualizar mejoras de edificios
    updateUpgradesDisplay();
    
    // Actualizar información de prestigio
    const ascensionInfo = document.getElementById('ascension-info');
    if (ascensionInfo) {
        const chipsAvailable = calculateHeavenlyChips();
        ascensionInfo.innerHTML = `
            <div class="stats-row">
                <span>Chips Celestiales:</span>
                <span>${formatNumber(heavenlyChips)}</span>
            </div>
            <div class="stats-row">
                <span>Multiplicador Celestial:</span>
                <span>×${heavenlyMultiplier.toFixed(2)}</span>
            </div>
            ${chipsAvailable > 0 ? `
            <div class="stats-row">
                <span>Chips disponibles al ascender:</span>
                <span>${formatNumber(chipsAvailable)}</span>
            </div>
            ` : ''}
        `;
    }
}

// Función para calcular el costo total basado en la cantidad
function calculateTotalCost(baseCost, amount) {
    return baseCost * amount;
}

// Función para cambiar entre pestañas
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');

    // Deshabilitar/habilitar botones según la pestaña
    const isBuildings = tabName === 'buildings';
    document.querySelectorAll('.buy-button').forEach(btn => {
        const isUpgradeButton = btn.getAttribute('onclick').includes('buyBuildingUpgrade');
        if (isBuildings) {
            // En pestaña edificios, solo permitir comprar edificios
            btn.disabled = isUpgradeButton;
            btn.style.opacity = isUpgradeButton ? '0.5' : '1';
        } else {
            // En pestaña mejoras, solo permitir comprar mejoras
            btn.disabled = !isUpgradeButton;
            btn.style.opacity = !isUpgradeButton ? '0.5' : '1';
        }
    });
}

// Función para comprar mejoras
function buyUpgrade(type) {
    // Verificar si estamos en la pestaña correcta
    if (!document.getElementById('buildings-tab').classList.contains('active')) {
        showNotification('¡Debes estar en la pestaña de Edificios para comprar edificios!', 'error');
        return;
    }

    const upgrade = upgrades[type];
    const totalCost = calculateTotalCost(upgrade.baseCost, buyMultiplier);
    
    if (cookies >= totalCost) {
        cookies -= totalCost;
        upgrade.count += buyMultiplier;
        clicksWithoutBuying = 0; // Resetear el contador cuando se compra algo
        
        // Resto de la lógica existente...
        const oldCps = upgrade.cps * upgrade.count;
        cookiesPerSecond = cookiesPerSecond - oldCps + (upgrade.cps * upgrade.count);
        
        updateDisplay();
        updateBuildingDisplay(type);
        checkAchievements();
        saveGame();
    } else {
        showNotification('¡No tienes suficientes galletas!', 'error');
    }
}

// Función para comprar mejoras de edificios
function buyBuildingUpgrade(buildingType, upgradeId) {
    // Verificar si estamos en la pestaña correcta
    if (!document.getElementById('upgrades-tab').classList.contains('active')) {
        showNotification('¡Debes estar en la pestaña de Mejoras para comprar mejoras!', 'error');
        return;
    }

    const building = upgrades[buildingType];
    const upgrade = buildingUpgrades[buildingType].find(u => u.id === upgradeId);
    
    if (!upgrade || upgrade.purchased || building.count < upgrade.requirement || cookies < upgrade.cost) {
        if (cookies < upgrade.cost) {
            showNotification('¡No tienes suficientes galletas!', 'error');
        } else if (building.count < upgrade.requirement) {
            showNotification(`¡Necesitas ${upgrade.requirement} ${buildings[buildingType].name}s!`, 'error');
        }
        return;
    }
    
    cookies -= upgrade.cost;
    upgrade.purchased = true;
    
    // Actualizar la producción del edificio
    const oldCps = building.cps;
    building.cps *= upgrade.multiplier;
    cookiesPerSecond += (building.cps - oldCps) * building.count;
    
    // Actualizar visualización
    updateDisplay();
    updateUpgradesDisplay();
    saveGame();
    
    showNotification('¡Mejora comprada con éxito!', 'success');
}

// Función para actualizar el ticker de noticias con animación
function updateNewsTickerWithAnimation() {
    const ticker = document.getElementById('news-ticker');
    const currentText = ticker.querySelector('span');
    
    // Crear y preparar el nuevo texto
    const newText = document.createElement('span');
    newText.textContent = newsMessages[Math.floor(Math.random() * newsMessages.length)];
    newText.style.opacity = '0';
    newText.style.transform = 'translateY(20px)';
    newText.style.transition = 'all 0.5s ease';
    
    // Animar la salida del texto actual
    currentText.style.opacity = '0';
    currentText.style.transform = 'translateY(-20px)';
    
    // Después de la animación de salida, cambiar el texto
    setTimeout(() => {
        ticker.removeChild(currentText);
        ticker.appendChild(newText);
        
        // Forzar un reflow
        newText.offsetHeight;
        
        // Animar la entrada del nuevo texto
        newText.style.opacity = '1';
        newText.style.transform = 'translateY(0)';
    }, 500);
}

// Función para manejar clicks en la galleta
function handleCookieClick() {
    // Lógica existente
    cookies += cookiesPerClick * multiplier * heavenlyMultiplier;
    gameStats.totalCookies += cookiesPerClick * multiplier * heavenlyMultiplier;
    gameStats.totalClicks++;
    clicksWithoutBuying++;
    
    // Lógica para el logro speedClicker
    const currentTime = Date.now();
    if (currentTime - lastClickTime <= 3000) {
        clickCounter++;
        if (clickCounter >= 15 && !achievements.speedClicker.unlocked) {
            achievements.speedClicker.unlocked = true;
            showNotification('¡Logro desbloqueado: Dedo Veloz!', 'achievement');
            updateAchievementsDisplay();
        }
    } else {
        clickCounter = 1;
    }
    lastClickTime = currentTime;
    
    // Lógica para el logro cookieMonster
    if (clicksWithoutBuying >= 100 && !achievements.cookieMonster.unlocked) {
        achievements.cookieMonster.unlocked = true;
        showNotification('¡Logro desbloqueado: Come Galletas!', 'achievement');
        updateAchievementsDisplay();
    }
    
    updateDisplay();
    createFloatingNumber('+' + formatNumber(cookiesPerClick * multiplier * heavenlyMultiplier));
    playClickSound();
    spawnClickParticles();
}

// Manejador del código Konami
document.addEventListener('keydown', (e) => {
    const konamiSequence = 'ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba';
    konamiCode += e.key;
    
    if (konamiCode.length > konamiSequence.length) {
        konamiCode = konamiCode.substring(1);
    }
    
    if (konamiCode === konamiSequence && !achievements.konami.unlocked) {
        achievements.konami.unlocked = true;
        cookies *= 2; // Duplica las galletas como bonus
        showNotification('¡Código Konami activado! Galletas duplicadas', 'achievement');
        updateAchievementsDisplay();
        updateDisplay();
        
        // Easter egg: escribir "idk" en la consola
        console.log("idk");
        
        // Mensaje secreto en ASCII art
        console.log(`
        ¯\\_(ツ)_/¯
        idk... pero tus galletas se duplicaron
        `);
    }
});

// Función para manejar clicks en galletas doradas
function handleGoldenCookieClick() {
    gameStats.goldenCookieClicks++;
    
    if (gameStats.goldenCookieClicks >= 50 && !achievements.goldenFinger.unlocked) {
        achievements.goldenFinger.unlocked = true;
        showNotification('¡Logro desbloqueado: Dedo de Oro!', 'achievement');
        updateAchievementsDisplay();
    }
}

// Función para verificar y actualizar logros
function checkAchievements() {
    let newAchievements = false;
    
    for (const [id, achievement] of Object.entries(achievements)) {
        if (!achievement.unlocked && achievement.requirement()) {
            achievement.unlocked = true;
            newAchievements = true;
            showNotification(`¡Logro desbloqueado: ${achievement.name}!`, 'achievement');
        }
    }
    
    if (newAchievements) {
        updateAchievementsDisplay();
        saveGame();
    }
}

// Función para actualizar la visualización de logros
function updateAchievementsDisplay() {
    const achievementsContainer = document.getElementById('achievements-container');
    if (!achievementsContainer) return;
    
    achievementsContainer.innerHTML = '';
    
    // Lista de logros secretos
    const secretAchievements = ['nightOwl', 'konami', 'cookieMonster', 'perfectBalance'];
    
    for (const [id, achievement] of Object.entries(achievements)) {
        const div = document.createElement('div');
        const isSecret = secretAchievements.includes(id);
        
        div.className = `achievement ${achievement.unlocked ? 'unlocked' : ''} ${isSecret ? 'secret' : ''}`;
        
        div.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">
                    ${isSecret && !achievement.unlocked ? '???' : achievement.description}
                </div>
            </div>
        `;
        
        // Añadir tooltip para logros bloqueados
        if (!achievement.unlocked) {
            div.title = isSecret ? '¡Logro secreto!' : '¡Logro bloqueado!';
        }
        
        achievementsContainer.appendChild(div);
    }
    
    // Actualizar contador de logros
    const unlockedCount = Object.values(achievements).filter(a => a.unlocked).length;
    const totalCount = Object.keys(achievements).length;
    const achievementsCounter = document.getElementById('achievements-unlocked-stat');
    if (achievementsCounter) {
        achievementsCounter.textContent = `${unlockedCount}/${totalCount}`;
    }
}

// Producción automática de galletas
setInterval(() => {
    const production = cookiesPerSecond;
    cookies += production;
    gameStats.totalCookies += production;
    updateDisplay();
}, 1000);

// Función para mostrar notificación de guardado
function showSaveNotification(message = "¡Juego guardado!") {
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Eliminar la notificación después de la animación
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Función para editar el nombre de la confitería
function toggleNameEdit() {
    const nameElement = document.getElementById('bakery-name');
    const currentName = nameElement.textContent;
    
    if (!nameElement.classList.contains('editing')) {
        // Entrar en modo edición
        nameElement.classList.add('editing');
        nameElement.contentEditable = true;
        nameElement.focus();
        
        // Seleccionar todo el texto
        const range = document.createRange();
        range.selectNodeContents(nameElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Cambiar el botón a "guardar"
        document.getElementById('edit-name').textContent = '💾';
    } else {
        // Guardar cambios
        nameElement.classList.remove('editing');
        nameElement.contentEditable = false;
        bakeryName = nameElement.textContent;
        
        // Restaurar el botón de edición
        document.getElementById('edit-name').textContent = '✏️';
        
        // Guardar en localStorage
        saveGame();
    }
}

// Evento para manejar la tecla Enter
document.getElementById('bakery-name').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        toggleNameEdit();
    }
});

// Función para actualizar la visualización de las mejoras
function updateUpgradesDisplay() {
    for (const [buildingType, upgrades] of Object.entries(buildingUpgrades)) {
        const container = document.getElementById(`${buildingType}-upgrades`);
        if (!container) continue;
        
        upgrades.forEach(upgrade => {
            const element = document.getElementById(`${buildingType}-upgrade-${upgrade.id}`);
            if (!element) return;
            
            const building = upgrades[buildingType];
            const isUnlocked = building && building.count >= upgrade.requirement;
            
            if (upgrade.purchased) {
                element.classList.add('purchased');
                element.classList.remove('locked');
            } else if (isUnlocked) {
                element.classList.remove('locked');
            } else {
                element.classList.add('locked');
            }
        });
    }
}

// Función para guardar el juego
function saveGame() {
    const gameData = {
        cookies: cookies,
        cookiesPerSecond: cookiesPerSecond,
        cookiesPerClick: cookiesPerClick,
        multiplier: multiplier,
        bakeryName: bakeryName,
        buyMultiplier: buyMultiplier,
        upgrades: upgrades,
        buildingUpgrades: buildingUpgrades,
        achievements: achievements,
        gameStats: {
            ...gameStats,
            goldenCookieClicks: gameStats.goldenCookieClicks
        },
        heavenlyChips: heavenlyChips,
        heavenlyMultiplier: heavenlyMultiplier,
        settings: {
            theme: document.body.className || 'default',
            shortNumbers: document.getElementById('short-numbers').checked,
            sound: document.getElementById('sound-enabled').checked,
            particles: document.getElementById('particles-enabled').checked
        }
    };
    
    localStorage.setItem('cookieClickerSave', JSON.stringify(gameData));
    showSaveNotification();
}

function exportSave() {
    const gameData = localStorage.getItem('cookieClickerSave');
    if (gameData) {
        const blob = new Blob([gameData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cookie_clicker_save.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Guardado exportado correctamente', 'success');
    }
}

function importSave() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const gameData = JSON.parse(e.target.result);
                localStorage.setItem('cookieClickerSave', JSON.stringify(gameData));
                loadGame();
                showNotification('¡Guardado importado correctamente!', 'success');
            } catch (error) {
                showNotification('Error al importar el guardado', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function wipeSave() {
    if (confirm('¿Estás seguro de que quieres borrar todo tu progreso? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('cookieClickerSave');
        location.reload();
    }
}

// Funciones de configuración
function updateTheme(theme) {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
}

function toggleShortNumbers() {
    const useShortNumbers = document.getElementById('short-numbers').checked;
    localStorage.setItem('shortNumbers', useShortNumbers);
    updateDisplay();
}

function toggleSound() {
    const soundEnabled = document.getElementById('sound-enabled').checked;
    localStorage.setItem('soundEnabled', soundEnabled);
}

function toggleParticles() {
    const particlesEnabled = document.getElementById('particles-enabled').checked;
    localStorage.setItem('particlesEnabled', particlesEnabled);
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

// Función para mostrar el menú de información
function showInfoMenu() {
    const menu = document.getElementById('info-menu');
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);
    menu.classList.remove('hidden');
    
    // Actualizar contenido del menú de información
    const menuContent = menu.querySelector('.menu-content');
    menuContent.innerHTML = `
        <div class="info-section">
            <h3>Versión</h3>
            <p>Cookie Clicker v${VERSION}</p>
        </div>
        <div class="info-section">
            <h3>Registro de Cambios</h3>
            ${Object.entries(CHANGELOG).map(([version, changes]) => `
                <div class="version-block">
                    <h4>v${version}</h4>
                    <ul>
                        ${changes.map(change => `<li>${change}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
        <div class="info-section">
            <h3>Créditos</h3>
            <p>Este es un clon educativo de Cookie Clicker.</p>
            <p>El juego original fue creado por Orteil.</p>
            <p>Esta versión fue creada con fines de aprendizaje.</p>
        </div>
    `;
    
    // Cerrar al hacer clic en el overlay
    overlay.addEventListener('click', hideInfoMenu);
}

// Función para ocultar el menú de información
function hideInfoMenu() {
    const menu = document.getElementById('info-menu');
    const overlay = document.querySelector('.menu-overlay');
    menu.classList.add('hidden');
    if (overlay) {
        overlay.remove();
    }
}

// Event listeners para el menú de opciones
document.addEventListener('DOMContentLoaded', function() {
    // Botones de navegación
    document.getElementById('options-btn').addEventListener('click', showOptionsMenu);
    document.getElementById('stats-btn').addEventListener('click', showStatsMenu);
    document.getElementById('info-btn').addEventListener('click', showInfoMenu);
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            hideOptionsMenu();
            hideStatsMenu();
            hideInfoMenu();
        });
    });
    
    // Event listeners para la edición del nombre
    const editNameBtn = document.getElementById('edit-name-btn');
    const saveNameBtn = document.getElementById('save-name-btn');
    const cancelNameBtn = document.getElementById('cancel-name-btn');
    const nameInput = document.getElementById('name-input');
    
    if (editNameBtn) editNameBtn.addEventListener('click', showNameEditor);
    if (saveNameBtn) saveNameBtn.addEventListener('click', saveBakeryName);
    if (cancelNameBtn) cancelNameBtn.addEventListener('click', hideNameEditor);
    
    // Permitir guardar con Enter en el input
    if (nameInput) {
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveBakeryName();
            }
        });
    }
    
    // Botones de guardado
    document.getElementById('save-btn').addEventListener('click', () => {
        saveGame();
        hideOptionsMenu();
    });
    document.getElementById('export-btn').addEventListener('click', exportSave);
    document.getElementById('import-btn').addEventListener('click', importSave);
    document.getElementById('wipe-btn').addEventListener('click', wipeSave);
    
    // Configuración
    document.getElementById('theme-select').addEventListener('change', (e) => updateTheme(e.target.value));
    document.getElementById('short-numbers').addEventListener('change', toggleShortNumbers);
    document.getElementById('sound-enabled').addEventListener('change', toggleSound);
    document.getElementById('particles-enabled').addEventListener('change', toggleParticles);
    
    // Cargar juego al inicio
    loadGame();
    
    // Autoguardado cada 5 minutos
    setInterval(saveGame, 30000);
});

// Función para cargar el juego
function loadGame() {
    const savedGame = localStorage.getItem('cookieClickerSave');
    if (savedGame) {
        try {
            const gameData = JSON.parse(savedGame);
            
            // Cargar variables básicas
            cookies = gameData.cookies || 0;
            cookiesPerSecond = gameData.cookiesPerSecond || 0;
            cookiesPerClick = gameData.cookiesPerClick || 1;
            multiplier = gameData.multiplier || 1;
            bakeryName = gameData.bakeryName || "La confitería de aleko";
            buyMultiplier = gameData.buyMultiplier || 1;
            
            // Actualizar el nombre en la interfaz
            const playerNameElement = document.getElementById('player-name');
            if (playerNameElement) {
                playerNameElement.textContent = 'aleko';
            }
            
            // Cargar estadísticas
            if (gameData.gameStats) {
                gameStats = gameData.gameStats;
            } else {
                gameStats = {
                    totalCookies: cookies,
                    totalClicks: 0,
                    startDate: new Date().toISOString(),
                    playTime: 0
                };
            }
            
            // Cargar mejoras
            if (gameData.upgrades) {
                for (const type in gameData.upgrades) {
                    if (upgrades[type]) {
                        upgrades[type] = gameData.upgrades[type];
                    }
                }
            }
            
            // Cargar mejoras de edificios
            if (gameData.buildingUpgrades) {
                for (const type in gameData.buildingUpgrades) {
                    if (buildingUpgrades[type]) {
                        buildingUpgrades[type] = gameData.buildingUpgrades[type];
                    }
                }
            }
            
            // Cargar logros
            if (gameData.achievements) {
                for (const id in gameData.achievements) {
                    if (achievements[id]) {
                        achievements[id].unlocked = gameData.achievements[id].unlocked;
                    }
                }
            }
            
            // Cargar configuración
            if (gameData.settings) {
                const { theme, shortNumbers, sound, particles } = gameData.settings;
                if (theme) updateTheme(theme);
                if (shortNumbers !== undefined) document.getElementById('short-numbers').checked = shortNumbers;
                if (sound !== undefined) document.getElementById('sound-enabled').checked = sound;
                if (particles !== undefined) document.getElementById('particles-enabled').checked = particles;
            }
            
            // Actualizar nombre de la confitería
            document.getElementById('bakery-name').textContent = bakeryName;
            
            // Actualizar CPS y visualización
            updateCPS();
            updateDisplay();
            updateAchievementsDisplay();
            
            // Actualizar filas de edificios
            for (const type in upgrades) {
                updateBuildingDisplay(type);
            }
            
            // Cargar datos de prestigio
            heavenlyChips = gameData.heavenlyChips || 0;
            heavenlyMultiplier = gameData.heavenlyMultiplier || 1;
            
            if (gameData.gameStats) {
                gameStats.ascensions = gameData.gameStats.ascensions || 0;
                gameStats.totalHeavenlyChips = gameData.gameStats.totalHeavenlyChips || 0;
            }
            
            showNotification('¡Juego cargado correctamente!', 'success');
        } catch (error) {
            showNotification('Error al cargar el juego', 'error');
            console.error('Error al cargar:', error);
        }
    }
}

// Inicialización
window.onload = function() {
    loadGame();
    // Actualizar noticias cada 10 segundos
    setInterval(updateNewsTickerWithAnimation, 10000);
    setInterval(() => {
        cookies += cookiesPerSecond;
        updateDisplay();
    }, 1000);
    setInterval(saveGame, 30000);
};

// Función para cambiar la cantidad de compra
function buyAmount(amount) {
    buyMultiplier = amount;
    // Actualizar botones
    document.querySelectorAll('.buy-amount').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(amount.toString())) {
            btn.classList.add('active');
        }
    });
    // Actualizar precios mostrados
    updateDisplayedPrices();
}

// Función para actualizar los precios mostrados
function updateDisplayedPrices() {
    for (const type in upgrades) {
        const baseCost = upgrades[type].baseCost;
        const totalCost = calculateTotalCost(baseCost, buyMultiplier);
        document.getElementById(`${type}-cost`).textContent = formatNumber(totalCost);
    }
}

// Función para calcular el costo total basado en la cantidad
function calculateTotalCost(baseCost, amount) {
    return baseCost * amount;
}

// Función para actualizar CPS
function updateCPS() {
    cookiesPerSecond = 0;
    for (const type in upgrades) {
        const building = upgrades[type];
        let buildingCps = building.cps;
        
        // Aplicar multiplicadores de mejoras
        if (buildingUpgrades[type]) {
            buildingUpgrades[type].forEach(upgrade => {
                if (upgrade.purchased) {
                    buildingCps *= upgrade.multiplier;
                }
            });
        }
        
        // Aplicar multiplicador celestial
        buildingCps *= heavenlyMultiplier;
        
        cookiesPerSecond += buildingCps * building.count;
    }
}

// Funciones del menú de opciones
function showOptionsMenu() {
    const menu = document.getElementById('options-menu');
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);
    menu.classList.remove('hidden');
    
    // Cerrar al hacer clic en el overlay
    overlay.addEventListener('click', hideOptionsMenu);
}

function hideOptionsMenu() {
    const menu = document.getElementById('options-menu');
    const overlay = document.querySelector('.menu-overlay');
    menu.classList.add('hidden');
    if (overlay) {
        overlay.remove();
    }
}

// Función para formatear tiempo
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Función para formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Función para mostrar el menú de estadísticas
function showStatsMenu() {
    const menu = document.getElementById('stats-menu');
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);
    menu.classList.remove('hidden');
    
    updateStatsDisplay();
    
    // Cerrar al hacer clic en el overlay
    overlay.addEventListener('click', hideStatsMenu);
}

// Función para ocultar el menú de estadísticas
function hideStatsMenu() {
    const menu = document.getElementById('stats-menu');
    const overlay = document.querySelector('.menu-overlay');
    menu.classList.add('hidden');
    if (overlay) {
        overlay.remove();
    }
}

// Función para actualizar la visualización de estadísticas
function updateStatsDisplay() {
    // Actualizar estadísticas generales
    document.getElementById('total-cookies-stat').textContent = formatNumber(gameStats.totalCookies);
    document.getElementById('time-played-stat').textContent = formatTime(gameStats.playTime);
    document.getElementById('start-date-stat').textContent = formatDate(gameStats.startDate);
    document.getElementById('total-clicks-stat').textContent = formatNumber(gameStats.totalClicks);
    document.getElementById('cookies-per-click-stat').textContent = formatNumber(cookiesPerClick);
    document.getElementById('cookies-per-second-stat').textContent = formatNumber(cookiesPerSecond);
    
    // Actualizar estadísticas de edificios
    const buildingsStats = document.getElementById('buildings-stats');
    buildingsStats.innerHTML = '';
    
    for (const [type, building] of Object.entries(buildings)) {
        const buildingStat = document.createElement('div');
        buildingStat.className = 'building-stat';
        
        const production = upgrades[type].cps * upgrades[type].count * multiplier;
        const totalProduction = (gameStats.totalCookies * (production / cookiesPerSecond)) || 0;
        
        buildingStat.innerHTML = `
            <div class="building-icon">${building.emoji}</div>
            <div class="building-info">
                <div class="building-name">${building.name}</div>
                <div class="building-details">
                    Producción: ${formatNumber(production)}/s
                    <br>
                    Total producido: ${formatNumber(totalProduction)}
                </div>
            </div>
            <div class="building-count">${upgrades[type].count}</div>
        `;
        
        buildingsStats.appendChild(buildingStat);
    }
    
    // Actualizar estadísticas de logros
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';
    
    const unlockedCount = Object.values(achievements).filter(a => a.unlocked).length;
    const totalCount = Object.keys(achievements).length;
    document.getElementById('achievements-unlocked-stat').textContent = `${unlockedCount}/${totalCount}`;
    
    for (const achievement of Object.values(achievements)) {
        const achievementStat = document.createElement('div');
        achievementStat.className = `achievement-stat ${achievement.unlocked ? 'unlocked' : ''}`;
        
        achievementStat.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
        
        achievementsList.appendChild(achievementStat);
    }
}

// Actualizar tiempo de juego cada segundo
setInterval(() => {
    gameStats.playTime++;
    if (document.getElementById('stats-menu') && !document.getElementById('stats-menu').classList.contains('hidden')) {
        updateStatsDisplay();
    }
}, 1000); 

// Función para calcular chips celestiales disponibles
function calculateHeavenlyChips() {
    return Math.floor(Math.pow(cookies / 1e12, 0.5));
}

// Función para verificar si se puede ascender
function canAscend() {
    return calculateHeavenlyChips() > 0;
}

// Función para realizar la ascensión
function ascend() {
    if (!canAscend()) {
        showNotification('Necesitas al menos 1 billón de galletas para ascender', 'error');
        return;
    }

    const newChips = calculateHeavenlyChips();
    const confirmMessage = `¿Estás seguro de que quieres ascender?\n\nObtendrás ${formatNumber(newChips)} chips celestiales.\nCada chip aumentará tu producción de galletas en un 2% permanentemente.\n\nPERDERÁS:\n- Todas tus galletas\n- Todos tus edificios\n- Todas las mejoras de edificios\n\nMANTENDRÁS:\n- Tus logros\n- Tus chips celestiales anteriores`;

    if (confirm(confirmMessage)) {
        // Guardar chips celestiales
        heavenlyChips += newChips;
        gameStats.totalHeavenlyChips += newChips;
        gameStats.ascensions++;
        
        // Actualizar multiplicador celestial
        heavenlyMultiplier = 1 + (heavenlyChips * 0.02);

        // Reiniciar el juego
        cookies = 0;
        cookiesPerSecond = 0;
        cookiesPerClick = 1;
        multiplier = 1;
        
        // Reiniciar edificios y mejoras
        for (const type in upgrades) {
            upgrades[type].count = 0;
        }
        
        for (const type in buildingUpgrades) {
            buildingUpgrades[type].forEach(upgrade => {
                upgrade.purchased = false;
            });
        }

        // Actualizar visualización
        updateDisplay();
        updateAchievementsDisplay();
        saveGame();
        
        showNotification(`¡Has ascendido! Obtuviste ${formatNumber(newChips)} chips celestiales`, 'success');
    }
}

// Función para mostrar el menú de legado
function showLegacyMenu() {
    document.getElementById('legacy-menu').classList.remove('hidden');
    updateLegacyMenu();
}

// Función para ocultar el menú de legado
function hideLegacyMenu() {
    document.getElementById('legacy-menu').classList.add('hidden');
}

// Función para actualizar la información del menú de legado
function updateLegacyMenu() {
    const currentChips = heavenlyChips;
    const currentMultiplier = heavenlyMultiplier;
    const newChips = calculateHeavenlyChips();
    const newMultiplier = 1 + ((currentChips + newChips) * 0.02); // 2% por chip

    document.getElementById('current-chips').textContent = formatNumber(currentChips);
    document.getElementById('current-multiplier').textContent = `+${formatNumber((currentMultiplier - 1) * 100)}%`;
    document.getElementById('prestige-chips').textContent = formatNumber(newChips);
    document.getElementById('new-multiplier').textContent = `+${formatNumber((newMultiplier - 1) * 100)}%`;
    
    document.getElementById('total-ascensions').textContent = formatNumber(gameStats.ascensions);
    document.getElementById('total-heavenly-chips').textContent = formatNumber(gameStats.totalHeavenlyChips);

    const ascendButton = document.getElementById('ascend-button');
    if (canAscend()) {
        ascendButton.disabled = false;
        ascendButton.querySelector('.tooltip').textContent = 
            `Ascender para ganar ${formatNumber(newChips)} chips celestiales`;
    } else {
        ascendButton.disabled = true;
        ascendButton.querySelector('.tooltip').textContent = 
            'Necesitas al menos 1 billón de galletas para ascender';
    }
}

// Añadir event listeners para el botón de legado
document.getElementById('legacy-btn').addEventListener('click', showLegacyMenu);
document.querySelector('#legacy-menu .close-btn').addEventListener('click', hideLegacyMenu);

// Actualizar la función updateDisplay para incluir la actualización del menú de legado
const originalUpdateDisplay = updateDisplay;
updateDisplay = function() {
    originalUpdateDisplay();
    if (!document.getElementById('legacy-menu').classList.contains('hidden')) {
        updateLegacyMenu();
    }
};

