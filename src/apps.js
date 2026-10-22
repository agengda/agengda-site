// Application / industry content for the multilingual site.
// All copy is qualitative on purpose: no cooling capacity, tonnage or power figures are invented here.
// Real numbers must come from the factory's verified datasheets.

const APPS = [
  { key: "inj", slug: "injection-molding", emoji: "🧱" },
  { key: "blow", slug: "blow-molding", emoji: "🍾" },
  { key: "extr", slug: "extrusion", emoji: "🧵" },
  { key: "rub", slug: "rubber-extrusion", emoji: "🛞" },
  { key: "laser", slug: "laser", emoji: "🔦" },
];

// Shared UI labels for the application pages, per language.
const APP_UI = {
  es: {
    nav: "Aplicaciones", kicker: "Aplicación industrial",
    pain_title: "Los problemas de enfriamiento más comunes en esta industria",
    fit_title: "Cómo dimensionamos tu equipo",
    more_title: "Otras aplicaciones",
    cta_title: "Dinos los datos de tu máquina y te dimensionamos",
    cta_text: "Compártenos el modelo o la capacidad y te decimos qué unidad necesitas.",
  },
  pt: {
    nav: "Aplicações", kicker: "Aplicação industrial",
    pain_title: "Os problemas de resfriamento mais comuns nesta indústria",
    fit_title: "Como dimensionamos o seu equipamento",
    more_title: "Outras aplicações",
    cta_title: "Passe os dados da máquina e dimensionamos para você",
    cta_text: "Informe o modelo ou a capacidade e dizemos qual unidade você precisa.",
  },
  en: {
    nav: "Applications", kicker: "Industrial application",
    pain_title: "The cooling problems we see most in this industry",
    fit_title: "How we size your unit",
    more_title: "Other applications",
    cta_title: "Send us your machine data and we will size it",
    cta_text: "Tell us the model or the capacity and we will recommend the right unit.",
  },
  zh: {
    nav: "应用行业", kicker: "行业应用",
    pain_title: "这个行业最常遇到的冷却问题",
    fit_title: "我们怎么给你配",
    more_title: "其他行业应用",
    cta_title: "报一下设备参数，我们帮你配型",
    cta_text: "告诉我们机型或产能，我们直接给你推荐合适的机型。",
  },
  de: {
    nav: "Anwendungen", kicker: "Industrielle Anwendung",
    pain_title: "Die häufigsten Kühlprobleme in dieser Branche",
    fit_title: "So dimensionieren wir Ihr Gerät",
    more_title: "Weitere Anwendungen",
    cta_title: "Nennen Sie uns Ihre Maschinendaten – wir dimensionieren",
    cta_text: "Modell oder Leistung genügt, wir empfehlen das passende Gerät.",
  },
  fr: {
    nav: "Applications", kicker: "Application industrielle",
    pain_title: "Les problèmes de refroidissement les plus fréquents dans ce secteur",
    fit_title: "Comment nous dimensionnons votre groupe",
    more_title: "Autres applications",
    cta_title: "Donnez-nous les données de votre machine, nous dimensionnons",
    cta_text: "Le modèle ou la capacité suffisent, nous vous indiquons le groupe adapté.",
  },
  tr: {
    nav: "Uygulamalar", kicker: "Endüstriyel uygulama",
    pain_title: "Bu sektörde en sık görülen soğutma sorunları",
    fit_title: "Üniteyi nasıl boyutlandırıyoruz",
    more_title: "Diğer uygulamalar",
    cta_title: "Makine verilerinizi iletin, boyutlandıralım",
    cta_text: "Model veya kapasiteyi söyleyin, uygun üniteyi önerelim.",
  },
  ru: {
    nav: "Применение", kicker: "Промышленное применение",
    pain_title: "Самые частые проблемы с охлаждением в отрасли",
    fit_title: "Как мы подбираем мощность",
    more_title: "Другие применения",
    cta_title: "Пришлите данные станка — подберём модель",
    cta_text: "Достаточно модели или мощности, мы предложим нужный агрегат.",
  },
  ar: {
    nav: "التطبيقات", kicker: "تطبيق صناعي",
    pain_title: "أكثر مشاكل التبريد شيوعاً في هذا القطاع",
    fit_title: "كيف نحدد سعة الوحدة",
    more_title: "تطبيقات أخرى",
    cta_title: "أرسل بيانات ماكينتك ونحدد لك الوحدة",
    cta_text: "يكفي الموديل أو السعة، وسنرشح الوحدة المناسبة.",
  },
  id: {
    nav: "Aplikasi", kicker: "Aplikasi industri",
    pain_title: "Masalah pendinginan yang paling sering terjadi di industri ini",
    fit_title: "Cara kami menghitung kapasitas unit",
    more_title: "Aplikasi lainnya",
    cta_title: "Kirim data mesin Anda, kami hitungkan unitnya",
    cta_text: "Cukup sebutkan model atau kapasitasnya, kami rekomendasikan unit yang tepat.",
  },
  vi: {
    nav: "Ứng dụng", kicker: "Ứng dụng công nghiệp",
    pain_title: "Những vấn đề làm mát thường gặp nhất trong ngành này",
    fit_title: "Cách chúng tôi tính chọn công suất",
    more_title: "Ứng dụng khác",
    cta_title: "Gửi thông số máy, chúng tôi tính chọn giúp bạn",
    cta_text: "Chỉ cần cho biết model hoặc công suất, chúng tôi đề xuất thiết bị phù hợp.",
  },
  th: {
    nav: "การใช้งาน", kicker: "การใช้งานในอุตสาหกรรม",
    pain_title: "ปัญหาความร้อนที่พบบ่อยที่สุดในอุตสาหกรรมนี้",
    fit_title: "เราคำนวณขนาดเครื่องอย่างไร",
    more_title: "การใช้งานอื่น ๆ",
    cta_title: "ส่งข้อมูลเครื่องมา เราคำนวณขนาดให้",
    cta_text: "บอกแค่รุ่นหรือกำลังการผลิต เราจะแนะนำเครื่องที่เหมาะสม",
  },
};

const APP_T = {
  es: {
    inj: {
      name: "Enfriamiento para inyección",
      intro: "Enfría molde y aceite hidráulico al mismo tiempo para estabilizar el ciclo y el porcentaje de piezas buenas.",
      pain: [
        "La temperatura del molde varía: piezas con rechupes, deformación y rebaba.",
        "El aceite hidráulico se calienta y la máquina se detiene por alarma.",
        "En verano el agua no enfría lo suficiente y el ciclo se alarga.",
      ],
      fit: [
        "Capacidad calculada según tonelaje de cierre y volumen de inyección.",
        "Circuito de molde y circuito de aceite con control independiente.",
        "Circuito anti-incrustación, sin desmontajes frecuentes.",
      ],
    },
    blow: {
      name: "Enfriamiento para soplado",
      intro: "Doble circuito para cabezal y sistema hidráulico: espesor uniforme y ciclos más cortos.",
      pain: [
        "La temperatura de la parisón varía y la pared sale despareja.",
        "Aceite hidráulico caliente: presión inestable y movimientos lentos.",
        "Sin enfriamiento suficiente la botella se deforma al salir del molde.",
      ],
      fit: [
        "Capacidad calculada por producción y número de cabezales.",
        "Gran caudal de agua fría para fijar la forma al salir.",
        "Cabezal e hidráulico en circuitos separados.",
      ],
    },
    extr: {
      name: "Enfriamiento para extrusión",
      intro: "Temperatura estable en cañón y husillo: tolerancias firmes y producción continua sin deriva.",
      pain: [
        "El cañón pierde control: plastificado irregular y material quemado.",
        "El agua del tanque de calibración varía y la medida se sale de tolerancia.",
        "Una parada del enfriador detiene toda la línea.",
      ],
      fit: [
        "Capacidad calculada por diámetro de husillo y producción.",
        "Gran caudal con temperatura constante y poca variación.",
        "Tanque, calibrador y baño de enfriamiento en un solo sistema.",
      ],
    },
    rub: {
      name: "Enfriamiento para extrusión de caucho",
      intro: "Enfriamiento por etapas de husillo y producto: menos riesgo de scorch y medida más estable.",
      pain: [
        "El compuesto sube rápido de temperatura dentro del husillo y crece el riesgo de scorch.",
        "Enfriamiento insuficiente a la salida: el perfil se pega y se deforma.",
        "Ambiente con caucho y polvo: el intercambiador se tapa con facilidad.",
      ],
      fit: [
        "Doble circuito: enfriamiento de husillo y de producto.",
        "Intercambiador desmontable para limpiar sin parar demasiado.",
        "Modelo elegido según tipo de compuesto y velocidad de extrusión.",
      ],
    },
    laser: {
      name: "Enfriamiento para láser",
      intro: "Temperatura estable en fuente y óptica: sin caída de potencia y con corte uniforme.",
      pain: [
        "La fuente láser calienta: baja la potencia y el haz se desvía.",
        "El agua varía de temperatura: corte irregular y rebaba.",
        "Si una máquina se detiene, se retrasa todo el pedido.",
      ],
      fit: [
        "Caudal y capacidad según la potencia del láser.",
        "Control de temperatura de alta precisión.",
        "Compatible con corte, soldadura y marcado fibra/CO2.",
      ],
    },
  },
  pt: {
    inj: {
      name: "Resfriamento para injeção",
      intro: "Resfria molde e óleo hidráulico ao mesmo tempo e estabiliza o ciclo e o índice de peças boas.",
      pain: [
        "Temperatura do molde oscila: peças com rechupo, empeno e rebarba.",
        "Óleo hidráulico quente: a máquina dá alarme e para.",
        "No verão a água não gela o suficiente e o ciclo alonga.",
      ],
      fit: [
        "Capacidade calculada pela força de fechamento e volume de injeção.",
        "Circuito do molde e do óleo com controle separado.",
        "Circuito anticrosta, sem desmontagem frequente.",
      ],
    },
    blow: {
      name: "Resfriamento para sopro",
      intro: "Dois circuitos para cabeça e hidráulica: parede uniforme e ciclo mais curto.",
      pain: [
        "Temperatura da pré-forma oscila e a parede sai desigual.",
        "Óleo hidráulico quente: pressão instável e movimento lento.",
        "Sem resfriamento suficiente a peça deforma ao sair do molde.",
      ],
      fit: [
        "Capacidade pela produção e número de cabeças.",
        "Grande vazão de água fria para fixar a forma.",
        "Cabeça e hidráulica em circuitos separados.",
      ],
    },
    extr: {
      name: "Resfriamento para extrusão",
      intro: "Temperatura estável no canhão e na rosca: tolerância firme e produção contínua sem deriva.",
      pain: [
        "Canhão perde controle: plastificação irregular e material queimado.",
        "Água do tanque de calibração varia e a medida sai da tolerância.",
        "Se o chiller para, a linha inteira para.",
      ],
      fit: [
        "Capacidade pelo diâmetro da rosca e produção.",
        "Grande vazão com temperatura constante.",
        "Tanque, calibrador e banho em um só sistema.",
      ],
    },
    rub: {
      name: "Resfriamento para extrusão de borracha",
      intro: "Resfriamento por etapas na rosca e no produto: menos risco de queima e medida estável.",
      pain: [
        "O composto esquenta rápido na rosca e o risco de queima aumenta.",
        "Resfriamento insuficiente na saída: o perfil gruda e deforma.",
        "Ambiente com borracha e pó entope o trocador com facilidade.",
      ],
      fit: [
        "Dois circuitos: resfriamento da rosca e do produto.",
        "Trocador removível para limpar sem parar muito.",
        "Modelo conforme composto e velocidade de extrusão.",
      ],
    },
    laser: {
      name: "Resfriamento para laser",
      intro: "Temperatura estável na fonte e na óptica: sem perda de potência e corte uniforme.",
      pain: [
        "A fonte aquece: a potência cai e o feixe desvia.",
        "Água com variação: corte irregular e rebarba.",
        "Uma máquina parada atrasa o pedido inteiro.",
      ],
      fit: [
        "Vazão e capacidade conforme a potência do laser.",
        "Controle de temperatura de alta precisão.",
        "Serve para corte, solda e marcação fibra/CO2.",
      ],
    },
  },
  en: {
    inj: {
      name: "Cooling for Injection Molding",
      intro: "Cool mold and hydraulic oil together to hold cycle time and yield steady.",
      pain: [
        "Mold temperature drifts, so parts show sink marks, warpage and flash.",
        "Hydraulic oil overheats and the machine alarms out.",
        "In summer the water cannot keep up, cycles stretch and scrap rises.",
      ],
      fit: [
        "Capacity calculated from clamping force and shot size.",
        "Separate control loops for mold water and hydraulic oil.",
        "Anti-scaling water circuit, no frequent teardown.",
      ],
    },
    blow: {
      name: "Cooling for Blow Molding",
      intro: "Dual circuits for the die head and hydraulics: even wall thickness and shorter cycles.",
      pain: [
        "Parison temperature swings and wall thickness runs uneven.",
        "Hot hydraulic oil means unstable pressure and slow motions.",
        "Weak cooling deforms parts as they leave the mold.",
      ],
      fit: [
        "Capacity from output rate and number of die heads.",
        "High-flow chilled water to freeze the shape on exit.",
        "Die head and hydraulic station on separate loops.",
      ],
    },
    extr: {
      name: "Cooling for Extrusion",
      intro: "Stable barrel and screw temperature: tight tolerances with no drift over 24-hour runs.",
      pain: [
        "Barrel temperature runs away: uneven plastification and burnt specks.",
        "Calibration tank water drifts and dimensions fall out of tolerance.",
        "One chiller stop takes the whole line down.",
      ],
      fit: [
        "Capacity from screw diameter and output rate.",
        "High flow at constant temperature with a narrow swing.",
        "Tank, calibrator and cooling bath on one system.",
      ],
    },
    rub: {
      name: "Cooling for Rubber Extrusion",
      intro: "Staged cooling on screw and product: lower scorch risk and stable profile size.",
      pain: [
        "Compound heats fast inside the screw and scorch risk climbs.",
        "Insufficient cooling at the exit: profiles stick and deform.",
        "Rubber dust and compound foul the heat exchanger quickly.",
      ],
      fit: [
        "Dual circuits: screw cooling and product cooling.",
        "Removable exchanger for cleaning without long stops.",
        "Model chosen by compound type and extrusion speed.",
      ],
    },
    laser: {
      name: "Cooling for Laser Processing",
      intro: "Stable temperature at source and optics: no power drop and consistent cut quality.",
      pain: [
        "The laser source heats up: power drops and the beam drifts.",
        "Water temperature swings cause uneven kerf and dross.",
        "One machine down pushes the whole order late.",
      ],
      fit: [
        "Capacity and flow matched to laser power.",
        "High-precision temperature control.",
        "Fits fiber/CO2 cutting, welding and marking.",
      ],
    },
  },
  zh: {
    inj: {
      name: "注塑机冷却",
      intro: "模具和液压油同时降温，稳住成型周期与良率。",
      pain: [
        "模具温度飘，产品缩水、变形、飞边。",
        "液压油温过高，机台报警停机。",
        "夏天水温压不下来，周期变长、不良率升高。",
      ],
      fit: [
        "按锁模力与射出量核算制冷量。",
        "模具水路与油温回路分开控温。",
        "防结垢水路，长期不用拆洗。",
      ],
    },
    blow: {
      name: "吹塑机冷却",
      intro: "模头与液压系统双回路降温，壁厚均匀、周期更短。",
      pain: [
        "型坯温度波动，瓶体壁厚不均。",
        "液压油高温，压力不稳、动作变慢。",
        "冷却不够，瓶子出模变形、周期拉长。",
      ],
      fit: [
        "按挤出量与模头数量核算制冷量。",
        "低温大流量水路，出模即定型。",
        "模头与液压站独立回路。",
      ],
    },
    extr: {
      name: "挤出机冷却",
      intro: "螺杆料筒恒温，尺寸公差稳，24 小时连续生产不飘。",
      pain: [
        "料筒温度失控，塑化不均、出现焦料。",
        "定型台水温不稳，制品尺寸超差。",
        "连续生产，冷水机一停就是整线停。",
      ],
      fit: [
        "按螺杆直径与产量核算制冷量。",
        "大流量恒温供水，温差压得住。",
        "水箱、定型套循环冷却一并配齐。",
      ],
    },
    rub: {
      name: "橡胶挤出机冷却",
      intro: "螺杆与制品分段降温，压住焦烧风险，断面尺寸更稳。",
      pain: [
        "胶料在螺杆内温升快，有焦烧风险。",
        "挤出后冷却不足，制品粘连、变形。",
        "胶料与粉尘环境，换热器容易脏堵。",
      ],
      fit: [
        "螺杆冷却与制品冷却做双回路。",
        "换热器可拆洗，维护不用长时间停机。",
        "按胶种和挤出速度定机型。",
      ],
    },
    laser: {
      name: "激光行业冷却",
      intro: "激光器与光学件恒温，功率不衰减，切割面更稳定。",
      pain: [
        "激光器发热，功率衰减、光斑漂移。",
        "水温波动，切缝宽窄不均、挂渣。",
        "一台机停，整批订单交期就往后拖。",
      ],
      fit: [
        "按激光功率匹配制冷量与流量。",
        "高精度温控，水温波动小。",
        "光纤激光切割、焊接、打码都适配。",
      ],
    },
  },
  de: {
    inj: {
      name: "Kühlung für Spritzguss",
      intro: "Werkzeug und Hydrauliköl gemeinsam kühlen: stabiler Zyklus und stabile Ausbeute.",
      pain: [
        "Werkzeugtemperatur schwankt: Einfallstellen, Verzug und Grat.",
        "Hydrauliköl überhitzt und die Maschine stoppt mit Alarm.",
        "Im Sommer reicht die Kühlung nicht, Zyklus und Ausschuss steigen.",
      ],
      fit: [
        "Leistung aus Schließkraft und Schussvolumen berechnet.",
        "Getrennte Regelkreise für Werkzeugwasser und Öl.",
        "Kalkarme Wasserführung, kein häufiges Öffnen.",
      ],
    },
    blow: {
      name: "Kühlung für Blasformen",
      intro: "Zwei Kreise für Düsenkopf und Hydraulik: gleichmäßige Wand und kürzere Zyklen.",
      pain: [
        "Vorformlingstemperatur schwankt, die Wanddicke läuft ungleich.",
        "Heißes Hydrauliköl: Druck instabil, Bewegungen langsam.",
        "Zu wenig Kühlung verzieht die Teile beim Entformen.",
      ],
      fit: [
        "Leistung aus Ausstoß und Anzahl der Düsenköpfe.",
        "Großer Kaltwasservolumenstrom zur Formfixierung.",
        "Düsenkopf und Hydraulikstation getrennt.",
      ],
    },
    extr: {
      name: "Kühlung für Extrusion",
      intro: "Stabile Zylinder- und Schneckentemperatur: enge Toleranzen, kein Drift im Dauerbetrieb.",
      pain: [
        "Zylindertemperatur läuft weg: ungleichmäßige Plastifizierung, verbrannte Stellen.",
        "Wasser im Kalibrierbecken driftet, Maße verlassen die Toleranz.",
        "Ein Kühlerstillstand stoppt die ganze Linie.",
      ],
      fit: [
        "Leistung aus Schneckendurchmesser und Durchsatz.",
        "Hoher Volumenstrom bei konstanter Temperatur.",
        "Becken, Kalibrierung und Kühlbad aus einem System.",
      ],
    },
    rub: {
      name: "Kühlung für Kautschukextrusion",
      intro: "Stufenkühlung von Schnecke und Produkt: weniger Anvulkanisieren und stabile Profilmaße.",
      pain: [
        "Die Mischung erwärmt sich in der Schnecke schnell, Anvulkanisiergefahr steigt.",
        "Zu wenig Kühlung am Auslauf: Profile kleben und verziehen.",
        "Gummi und Staub verstopfen den Wärmetauscher schnell.",
      ],
      fit: [
        "Zwei Kreise: Schnecken- und Produktkühlung.",
        "Wärmetauscher abnehmbar, Reinigung ohne lange Stopps.",
        "Modell nach Mischungstyp und Extrusionsgeschwindigkeit.",
      ],
    },
    laser: {
      name: "Kühlung für Lasertechnik",
      intro: "Konstante Temperatur an Quelle und Optik: keine Leistungsabnahme, gleichmäßiger Schnitt.",
      pain: [
        "Die Laserquelle erwärmt sich: Leistung sinkt und der Strahl wandert.",
        "Wassertemperatur schwankt: ungleichmäßige Schnittfuge und Grat.",
        "Eine stehende Maschine verzögert den ganzen Auftrag.",
      ],
      fit: [
        "Leistung und Durchfluss passend zur Laserleistung.",
        "Hochpräzise Temperaturregelung.",
        "Für Faser-/CO2-Schneiden, Schweißen und Markieren.",
      ],
    },
  },
  fr: {
    inj: {
      name: "Refroidissement pour injection",
      intro: "Refroidir moule et huile hydraulique ensemble: cycle régulier et taux de bonnes pièces stable.",
      pain: [
        "La température du moule dérive: retassures, déformations et bavures.",
        "L'huile hydraulique surchauffe et la presse s'arrête en alarme.",
        "En été l'eau ne suit plus, le cycle s'allonge.",
      ],
      fit: [
        "Puissance calculée selon la force de fermeture et la masse injectée.",
        "Circuits séparés pour l'eau du moule et l'huile.",
        "Circuit anti-tartre, sans démontage fréquent.",
      ],
    },
    blow: {
      name: "Refroidissement pour soufflage",
      intro: "Double circuit tête et hydraulique: épaisseur régulière et cycles plus courts.",
      pain: [
        "La température de la paraison varie et l'épaisseur sort irrégulière.",
        "Huile hydraulique chaude: pression instable et mouvements lents.",
        "Refroidissement insuffisant: la pièce se déforme au démoulage.",
      ],
      fit: [
        "Puissance selon le débit et le nombre de têtes.",
        "Fort débit d'eau froide pour figer la forme.",
        "Tête et centrale hydraulique sur circuits séparés.",
      ],
    },
    extr: {
      name: "Refroidissement pour extrusion",
      intro: "Température stable du fourreau et de la vis: tolérances serrées, sans dérive en continu.",
      pain: [
        "Le fourreau s'emballe: plastification irrégulière et points brûlés.",
        "L'eau du bac de calibrage dérive et les cotes sortent des tolérances.",
        "Un arrêt du refroidisseur arrête toute la ligne.",
      ],
      fit: [
        "Puissance selon le diamètre de vis et le débit.",
        "Fort débit à température constante, faible écart.",
        "Bac, calibreur et bain sur un seul système.",
      ],
    },
    rub: {
      name: "Refroidissement pour extrusion caoutchouc",
      intro: "Refroidissement étagé vis et produit: moins de risque de grillage et cotes stables.",
      pain: [
        "Le mélange chauffe vite dans la vis: le risque de grillage augmente.",
        "Refroidissement insuffisant en sortie: profils collants et déformés.",
        "Caoutchouc et poussière encrassent vite l'échangeur.",
      ],
      fit: [
        "Deux circuits: vis et produit.",
        "Échangeur démontable, nettoyage sans long arrêt.",
        "Modèle selon le mélange et la vitesse d'extrusion.",
      ],
    },
    laser: {
      name: "Refroidissement pour laser",
      intro: "Température stable source et optique: pas de perte de puissance, coupe régulière.",
      pain: [
        "La source chauffe: la puissance baisse et le faisceau dérive.",
        "L'eau varie: saignée irrégulière et bavures.",
        "Une machine à l'arrêt retarde toute la commande.",
      ],
      fit: [
        "Débit et puissance adaptés à la puissance laser.",
        "Régulation de température haute précision.",
        "Compatible découpe, soudage et marquage fibre/CO2.",
      ],
    },
  },
  tr: {
    inj: {
      name: "Enjeksiyon için soğutma",
      intro: "Kalıbı ve hidrolik yağı birlikte soğutun: çevrim ve kaliteli parça oranı sabit kalsın.",
      pain: [
        "Kalıp sıcaklığı kayıyor: çekme, eğilme ve çapak oluşuyor.",
        "Hidrolik yağı aşırı ısınıyor ve makine alarmla duruyor.",
        "Yazın su yetmiyor, çevrim uzuyor ve fire artıyor.",
      ],
      fit: [
        "Kapasite kapatma kuvveti ve enjeksiyon hacmine göre hesaplanır.",
        "Kalıp suyu ve yağ için ayrı kontrol devreleri.",
        "Kireçlenmeyen su devresi, sık sökme gerekmez.",
      ],
    },
    blow: {
      name: "Şişirme için soğutma",
      intro: "Kafa ve hidrolik için çift devre: eşit cidar kalınlığı ve daha kısa çevrim.",
      pain: [
        "Ön şekil sıcaklığı oynuyor, cidar kalınlığı dengesiz çıkıyor.",
        "Sıcak hidrolik yağı: basınç dengesiz, hareketler yavaş.",
        "Soğutma yetersizse parça kalıptan çıkarken deforme oluyor.",
      ],
      fit: [
        "Kapasite üretim ve kafa sayısına göre.",
        "Şekli sabitlemek için yüksek debili soğuk su.",
        "Kafa ve hidrolik istasyonu ayrı devrelerde.",
      ],
    },
    extr: {
      name: "Ekstrüzyon için soğutma",
      intro: "Namlu ve vida sıcaklığı sabit: dar tolerans, 24 saat çalışmada kayma yok.",
      pain: [
        "Namlu sıcaklığı kaçıyor: düzensiz plastikleşme ve yanık izler.",
        "Kalibrasyon tankı suyu kayıyor, ölçü toleransı aşıyor.",
        "Soğutucu bir kez durursa tüm hat durur.",
      ],
      fit: [
        "Kapasite vida çapı ve üretime göre.",
        "Sabit sıcaklıkta yüksek debi, dar sapma.",
        "Tank, kalibratör ve soğutma banyosu tek sistemde.",
      ],
    },
    rub: {
      name: "Kauçuk ekstrüzyonu için soğutma",
      intro: "Vida ve ürün kademeli soğutma: yanma riski azalır ve profil ölçüsü sabit kalır.",
      pain: [
        "Karışım vidada hızla ısınır ve yanma riski artar.",
        "Çıkışta soğutma yetersiz: profil yapışır ve deforme olur.",
        "Kauçuk ve toz ortamı eşanjörü çabuk tıkar.",
      ],
      fit: [
        "İki devre: vida ve ürün soğutma.",
        "Sökülebilir eşanjör, uzun duruş olmadan temizlik.",
        "Model karışım tipi ve ekstrüzyon hızına göre.",
      ],
    },
    laser: {
      name: "Lazer için soğutma",
      intro: "Kaynak ve optikte sabit sıcaklık: güç düşmez ve kesim kararlı olur.",
      pain: [
        "Lazer kaynağı ısınır: güç düşer ve ışın kayar.",
        "Su sıcaklığı oynar: kesim aralığı düzensiz, çapak oluşur.",
        "Bir makine durunca tüm sipariş gecikir.",
      ],
      fit: [
        "Kapasite ve debi lazer gücüne göre.",
        "Yüksek hassasiyetli sıcaklık kontrolü.",
        "Fiber/CO2 kesim, kaynak ve markalamaya uygun.",
      ],
    },
  },
  ru: {
    inj: {
      name: "Охлаждение для литья под давлением",
      intro: "Охлаждаем форму и гидравлическое масло одновременно: стабильный цикл и выход годных.",
      pain: [
        "Температура формы уплывает: утяжины, коробление и облой.",
        "Масло перегревается, станок встаёт по аварии.",
        "Летом воды не хватает: цикл растёт, брак увеличивается.",
      ],
      fit: [
        "Мощность считаем по усилию смыкания и объёму впрыска.",
        "Отдельные контуры для воды формы и масла.",
        "Контур без накипи, без частых разборок.",
      ],
    },
    blow: {
      name: "Охлаждение для выдува",
      intro: "Два контура — головка и гидравлика: ровная стенка и короче цикл.",
      pain: [
        "Температура заготовки плавает, толщина стенки неравномерна.",
        "Горячее масло: давление нестабильно, движения медленные.",
        "Не хватает охлаждения — изделие деформируется на выходе.",
      ],
      fit: [
        "Мощность по производительности и числу головок.",
        "Большой расход холодной воды для фиксации формы.",
        "Головка и гидростанция на разных контурах.",
      ],
    },
    extr: {
      name: "Охлаждение для экструзии",
      intro: "Стабильная температура цилиндра и шнека: жёсткие допуски без дрейфа сутками.",
      pain: [
        "Температура цилиндра уходит: неравномерная пластикация и подгорание.",
        "Вода в калибровочной ванне плавает, размер выходит из допуска.",
        "Остановка чиллера останавливает всю линию.",
      ],
      fit: [
        "Мощность по диаметру шнека и производительности.",
        "Большой расход при постоянной температуре.",
        "Ванна, калибратор и охлаждение в одной системе.",
      ],
    },
    rub: {
      name: "Охлаждение для экструзии резины",
      intro: "Поэтапное охлаждение шнека и изделия: меньше риск подвулканизации, стабильный размер.",
      pain: [
        "Смесь быстро греется в шнеке, риск подвулканизации растёт.",
        "Мало охлаждения на выходе: профиль липнет и деформируется.",
        "Резина и пыль быстро забивают теплообменник.",
      ],
      fit: [
        "Два контура: охлаждение шнека и изделия.",
        "Съёмный теплообменник — чистка без долгих простоев.",
        "Модель по типу смеси и скорости экструзии.",
      ],
    },
    laser: {
      name: "Охлаждение для лазера",
      intro: "Стабильная температура излучателя и оптики: мощность не падает, рез ровный.",
      pain: [
        "Излучатель греется: мощность падает, луч уходит.",
        "Температура воды плавает: неровный рез и грат.",
        "Один станок встал — весь заказ сдвинулся.",
      ],
      fit: [
        "Мощность и расход под мощность лазера.",
        "Высокоточное регулирование температуры.",
        "Подходит для резки, сварки и маркировки волокном/CO2.",
      ],
    },
  },
  ar: {
    inj: {
      name: "التبريد لماكينات الحقن",
      intro: "تبريد القالب والزيت الهيدروليكي معاً: دورة ثابتة ونسبة إنتاج سليم أعلى.",
      pain: [
        "حرارة القالب تتذبذب: انكماش وتشوه وزوائد.",
        "زيت الهيدروليك يسخن والماكينة تتوقف بإنذار.",
        "في الصيف لا تكفي المياه: الدورة تطول والعيوب تزيد.",
      ],
      fit: [
        "السعة تُحسب من قوة الإغلاق وحجم الحقن.",
        "دائرتان منفصلتان لمياه القالب والزيت.",
        "دائرة مقاومة للترسبات دون فك متكرر.",
      ],
    },
    blow: {
      name: "التبريد لماكينات النفخ",
      intro: "دائرتان للرأس والهيدروليك: سماكة متساوية ودورة أقصر.",
      pain: [
        "حرارة القطعة الأولية تتغير فتخرج السماكة غير متساوية.",
        "زيت هيدروليك ساخن: ضغط غير مستقر وحركة بطيئة.",
        "تبريد غير كافٍ يشوه القطعة عند خروجها من القالب.",
      ],
      fit: [
        "السعة حسب الإنتاجية وعدد الرؤوس.",
        "تدفق كبير من الماء البارد لتثبيت الشكل.",
        "الرأس ومحطة الهيدروليك في دائرتين منفصلتين.",
      ],
    },
    extr: {
      name: "التبريد لماكينات البثق",
      intro: "حرارة ثابتة للأسطوانة واللولب: تفاوتات ضيقة دون انحراف على مدار الساعة.",
      pain: [
        "حرارة الأسطوانة تنفلت: لدونة غير متساوية واحتراق للمادة.",
        "ماء حوض المعايرة يتغير والمقاس يخرج عن التفاوت.",
        "توقف المبرد يوقف الخط بالكامل.",
      ],
      fit: [
        "السعة حسب قطر اللولب والإنتاجية.",
        "تدفق كبير بدرجة حرارة ثابتة وتذبذب ضيق.",
        "الحوض والمعاير وحمام التبريد في نظام واحد.",
      ],
    },
    rub: {
      name: "التبريد لبثق المطاط",
      intro: "تبريد مرحلي للولب والمنتج: مخاطر الاحتراق أقل والمقاس أثبت.",
      pain: [
        "الخليط يسخن سريعاً داخل اللولب وتزداد مخاطر الاحتراق.",
        "تبريد ضعيف عند الخروج: البروفيل يلتصق ويتشوه.",
        "المطاط والغبار يسدان المبادل الحراري بسرعة.",
      ],
      fit: [
        "دائرتان: تبريد اللولب وتبريد المنتج.",
        "مبادل حراري قابل للفك والتنظيف دون توقف طويل.",
        "الموديل حسب نوع الخليط وسرعة البثق.",
      ],
    },
    laser: {
      name: "التبريد لتطبيقات الليزر",
      intro: "حرارة ثابتة للمصدر والبصريات: لا انخفاض في القدرة والقطع منتظم.",
      pain: [
        "مصدر الليزر يسخن: القدرة تنخفض والشعاع ينحرف.",
        "تذبذب حرارة الماء: عرض قطع غير منتظم وخشونة.",
        "توقف ماكينة واحدة يؤخر الطلب بالكامل.",
      ],
      fit: [
        "السعة والتدفق حسب قدرة الليزر.",
        "تحكم دقيق جداً في درجة الحرارة.",
        "مناسب لقص ولحام ووسم الفايبر وCO2.",
      ],
    },
  },
  id: {
    inj: {
      name: "Pendinginan untuk Mesin Injeksi",
      intro: "Mendinginkan cetakan dan oli hidraulik sekaligus: siklus dan hasil baik tetap stabil.",
      pain: [
        "Suhu cetakan bergeser: penyusutan, warpage dan flash.",
        "Oli hidraulik terlalu panas, mesin alarm dan berhenti.",
        "Musim panas air tidak cukup dingin, siklus melar.",
      ],
      fit: [
        "Kapasitas dihitung dari gaya cekam dan volume injeksi.",
        "Sirkuit terpisah untuk air cetakan dan oli.",
        "Jalur air anti kerak, tanpa bongkar sering.",
      ],
    },
    blow: {
      name: "Pendinginan untuk Mesin Blow Molding",
      intro: "Dua sirkuit untuk die head dan hidraulik: ketebalan merata dan siklus lebih pendek.",
      pain: [
        "Suhu parison berubah, ketebalan dinding tidak merata.",
        "Oli hidraulik panas: tekanan tidak stabil, gerakan lambat.",
        "Pendinginan kurang membuat produk deformasi saat keluar.",
      ],
      fit: [
        "Kapasitas dari output dan jumlah die head.",
        "Debit air dingin besar untuk mengunci bentuk.",
        "Die head dan hidraulik di sirkuit terpisah.",
      ],
    },
    extr: {
      name: "Pendinginan untuk Mesin Ekstrusi",
      intro: "Suhu barel dan screw stabil: toleransi ketat tanpa pergeseran sepanjang 24 jam.",
      pain: [
        "Suhu barel lepas kendali: plastifikasi tidak merata dan ada gosong.",
        "Air tangki kalibrasi bergeser, dimensi keluar toleransi.",
        "Chiller berhenti sebentar, seluruh lini ikut berhenti.",
      ],
      fit: [
        "Kapasitas dari diameter screw dan output.",
        "Debit besar dengan suhu konstan.",
        "Tangki, kalibrator dan bak pendingin satu sistem.",
      ],
    },
    rub: {
      name: "Pendinginan untuk Ekstrusi Karet",
      intro: "Pendinginan bertahap di screw dan produk: risiko scorch turun dan ukuran profil stabil.",
      pain: [
        "Kompon cepat panas di dalam screw, risiko scorch naik.",
        "Pendinginan kurang di keluaran: profil lengket dan berubah bentuk.",
        "Karet dan debu cepat menyumbat heat exchanger.",
      ],
      fit: [
        "Dua sirkuit: pendingin screw dan pendingin produk.",
        "Heat exchanger bisa dibongkar untuk dibersihkan.",
        "Model dipilih dari jenis kompon dan kecepatan ekstrusi.",
      ],
    },
    laser: {
      name: "Pendinginan untuk Industri Laser",
      intro: "Suhu sumber dan optik stabil: daya tidak turun dan hasil potong konsisten.",
      pain: [
        "Sumber laser memanas: daya turun dan berkas bergeser.",
        "Suhu air berubah: celah potong tidak rata dan ada geram.",
        "Satu mesin berhenti, seluruh pesanan tertunda.",
      ],
      fit: [
        "Kapasitas dan debit sesuai daya laser.",
        "Kontrol suhu presisi tinggi.",
        "Cocok untuk potong, las dan marking fiber/CO2.",
      ],
    },
  },
  vi: {
    inj: {
      name: "Làm mát cho máy ép phun",
      intro: "Làm mát khuôn và dầu thủy lực cùng lúc: chu kỳ và tỷ lệ hàng tốt ổn định.",
      pain: [
        "Nhiệt độ khuôn dao động: rỗ co, cong vênh và ba via.",
        "Dầu thủy lực quá nóng, máy báo lỗi và dừng.",
        "Mùa hè nước không đủ lạnh, chu kỳ kéo dài.",
      ],
      fit: [
        "Công suất tính theo lực kẹp và thể tích phun.",
        "Hai vòng riêng cho nước khuôn và dầu.",
        "Đường nước chống cáu, không phải tháo thường xuyên.",
      ],
    },
    blow: {
      name: "Làm mát cho máy thổi",
      intro: "Hai vòng cho đầu thổi và thủy lực: thành đều và chu kỳ ngắn hơn.",
      pain: [
        "Nhiệt độ phôi thổi thay đổi, thành dày mỏng không đều.",
        "Dầu thủy lực nóng: áp không ổn và động tác chậm.",
        "Làm mát không đủ, sản phẩm biến dạng khi ra khuôn.",
      ],
      fit: [
        "Công suất theo sản lượng và số đầu thổi.",
        "Lưu lượng nước lạnh lớn để định hình ngay.",
        "Đầu thổi và trạm thủy lực dùng vòng riêng.",
      ],
    },
    extr: {
      name: "Làm mát cho máy đùn",
      intro: "Nhiệt độ xy lanh và trục vít ổn định: dung sai chặt, chạy 24 giờ không trôi.",
      pain: [
        "Nhiệt độ xy lanh vượt kiểm soát: nhựa hóa không đều, có cháy cục bộ.",
        "Nước bồn định hình dao động, kích thước ra ngoài dung sai.",
        "Máy làm lạnh dừng một lần là cả dây chuyền dừng.",
      ],
      fit: [
        "Công suất theo đường kính trục vít và sản lượng.",
        "Lưu lượng lớn, nhiệt độ không đổi.",
        "Bồn, bộ định hình và bể làm mát chung một hệ.",
      ],
    },
    rub: {
      name: "Làm mát cho máy đùn cao su",
      intro: "Làm mát từng đoạn ở trục vít và sản phẩm: giảm nguy cơ cháy và kích thước ổn định.",
      pain: [
        "Hỗn liệu nóng nhanh trong trục vít, dễ cháy sớm.",
        "Làm mát đầu ra không đủ: profile dính và biến dạng.",
        "Cao su và bụi làm bẩn bộ trao đổi nhiệt nhanh.",
      ],
      fit: [
        "Hai vòng: làm mát trục vít và làm mát sản phẩm.",
        "Bộ trao đổi nhiệt tháo rời, vệ sinh không cần dừng lâu.",
        "Chọn model theo loại hỗn liệu và tốc độ đùn.",
      ],
    },
    laser: {
      name: "Làm mát cho ngành laser",
      intro: "Nhiệt độ nguồn laser và quang học ổn định: công suất không tụt, đường cắt đều.",
      pain: [
        "Nguồn laser nóng lên: công suất giảm và chùm tia lệch.",
        "Nhiệt độ nước dao động: mạch cắt không đều, có ba via.",
        "Một máy dừng là cả đơn hàng chậm.",
      ],
      fit: [
        "Công suất và lưu lượng theo công suất laser.",
        "Kiểm soát nhiệt độ độ chính xác cao.",
        "Phù hợp cắt, hàn và khắc fiber/CO2.",
      ],
    },
  },
  th: {
    inj: {
      name: "ทำความเย็นสำหรับเครื่องฉีดพลาสติก",
      intro: "ระบายความร้อนแม่พิมพ์และน้ำมันไฮดรอลิกพร้อมกัน รอบการผลิตและอัตราของดีคงที่",
      pain: [
        "อุณหภูมิแม่พิมพ์แกว่ง ชิ้นงานย้วย บิดเบี้ยว และมีครีบ",
        "น้ำมันไฮดรอลิกร้อนเกิน เครื่องฟ้องและหยุด",
        "หน้าร้อนน้ำเย็นไม่พอ รอบผลิตยาวขึ้น",
      ],
      fit: [
        "คำนวณกำลังทำความเย็นจากแรงปิดและปริมาณฉีด",
        "แยกวงจรน้ำแม่พิมพ์และน้ำมัน",
        "วงจรน้ำกันตะกรัน ไม่ต้องถอดล้างบ่อย",
      ],
    },
    blow: {
      name: "ทำความเย็นสำหรับเครื่องเป่าขวด",
      intro: "สองวงจรสำหรับหัวเป่าและไฮดรอลิก ผนังสม่ำเสมอ รอบเร็วขึ้น",
      pain: [
        "อุณหภูมิพาริสันเปลี่ยน ผนังหนาไม่เท่ากัน",
        "น้ำมันไฮดรอลิกร้อน แรงดันไม่นิ่ง การเคลื่อนไหวช้า",
        "เย็นไม่พอ ชิ้นงานบิดเบี้ยวตอนออกจากแม่พิมพ์",
      ],
      fit: [
        "กำลังทำความเย็นจากกำลังผลิตและจำนวนหัวเป่า",
        "น้ำเย็นปริมาณมากเพื่อล็อกทรงทันที",
        "หัวเป่าและชุดไฮดรอลิกแยกวงจร",
      ],
    },
    extr: {
      name: "ทำความเย็นสำหรับเครื่องรีด",
      intro: "อุณหภูมิกระบอกและสกรูนิ่ง พิกัดแน่น ไม่เพี้ยนแม้เดิน 24 ชั่วโมง",
      pain: [
        "อุณหภูมิกระบอกหลุดควบคุม พลาสติกไม่สม่ำเสมอและไหม้เกรียม",
        "น้ำในถังคาลิเบรตแกว่ง ขนาดออกนอกพิกัด",
        "ชิลเลอร์หยุดครั้งเดียว สายการผลิตหยุดทั้งหมด",
      ],
      fit: [
        "กำลังทำความเย็นจากขนาดสกรูและกำลังผลิต",
        "อัตราการไหลสูง อุณหภูมินิ่ง",
        "ถัง คาลิเบรต และอ่างหล่อเย็นใช้ระบบเดียว",
      ],
    },
    rub: {
      name: "ทำความเย็นสำหรับรีดยาง",
      intro: "ลดอุณหภูมิเป็นช่วงทั้งสกรูและชิ้นงาน ลดความเสี่ยงไหม้เกรียม ขนาดนิ่ง",
      pain: [
        "ยางร้อนเร็วในสกรู เสี่ยงไหม้เกรียม",
        "หล่อเย็นปลายทางไม่พอ ชิ้นงานติดกันและบิดเบี้ยว",
        "ยางและฝุ่นอุดตันตัวแลกเปลี่ยนความร้อนเร็ว",
      ],
      fit: [
        "สองวงจร: หล่อเย็นสกรูและชิ้นงาน",
        "ตัวแลกเปลี่ยนความร้อนถอดล้างได้ ไม่ต้องหยุดนาน",
        "เลือกรุ่นตามชนิดยางและความเร็วรีด",
      ],
    },
    laser: {
      name: "ทำความเย็นสำหรับงานเลเซอร์",
      intro: "อุณหภูมิแหล่งกำเนิดและเลนส์นิ่ง กำลังไม่ตก รอยตัดสม่ำเสมอ",
      pain: [
        "แหล่งกำเนิดเลเซอร์ร้อน กำลังตก ลำแสงเบี่ยง",
        "อุณหภูมิน้ำแกว่ง รอยตัดไม่เรียบและมีตะกรัน",
        "เครื่องหนึ่งหยุด คำสั่งซื้อทั้งล็อตล่าช้า",
      ],
      fit: [
        "กำลังและอัตราการไหลตามกำลังเลเซอร์",
        "ควบคุมอุณหภูมิความแม่นยำสูง",
        "ใช้ได้กับงานตัด เชื่อม และยิงเลเซอร์ fiber/CO2",
      ],
    },
  },
};

module.exports = { APPS, APP_UI, APP_T };
