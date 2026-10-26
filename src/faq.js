// Per-language FAQ copy for product (series) and application (app) pages.
// Each entry is an array of 4 [question, answer] pairs. {name} is replaced at
// build time with the localized product / application name. The same copy drives
// both the on-page FAQ section and the FAQPage structured-data block, so Google
// sees exactly the text shown to users (required for FAQ rich results).
//
// Intent coverage (helps long-tail ranking + rich snippets):
//  1. What is it used for / which industries
//  2. Custom voltage / specs / OEM
//  3. Lead time / MOQ
//  4. How to get a quote / price

const FAQ = {
  en: [
    ["What is the {name} used for?",
     "The {name} delivers stable process cooling for plastic injection molding, extrusion, laser, and other industrial lines, keeping equipment within a safe temperature range to reduce downtime and scrap."],
    ["Can you customize voltage and specifications or provide OEM?",
     "Yes. We are a source factory with in-house R&D and support custom voltage (220V/380V/415V), refrigerant, and OEM/private-label production to match your market."],
    ["What is the typical lead time and minimum order?",
     "Standard models usually ship within 2–4 weeks; lead time for customized units depends on specifications. Minimum order is flexible — contact us for your project."],
    ["How do I get a quotation?",
     "Send us your machine type, required cooling capacity, and voltage via WhatsApp or the contact form; we size the right unit and quote within one business day."],
  ],
  es: [
    ["¿Para qué sirve el {name}?",
     "El {name} proporciona enfriamiento de proceso estable para moldeo por inyección de plástico, extrusión, láser y otras líneas industriales, manteniendo el equipo en un rango de temperatura seguro para reducir tiempos muertos y rechazos."],
    ["¿Personalizan voltaje y especificaciones o hacen OEM?",
     "Sí. Somos fábrica de origen con capacidad de I+D y soportamos voltaje personalizado (220V/380V/415V), refrigerante y producción OEM/marca blanca según su mercado."],
    ["¿Cuál es el tiempo de entrega y pedido mínimo?",
     "Los modelos estándar suelen enviarse en 2–4 semanas; el tiempo de los equipos personalizados depende de las especificaciones. El pedido mínimo es flexible; contáctenos para su proyecto."],
    ["¿Cómo obtengo una cotización?",
     "Envíenos por WhatsApp o el formulario su tipo de máquina, capacidad de enfriamiento y voltaje; dimensionamos la unidad correcta y cotizamos en un día hábil."],
  ],
  pt: [
    ["Para que serve o {name}?",
     "O {name} oferece resfriamento de processo estável para injeção de plástico, extrusão, laser e outras linhas industriais, mantendo o equipamento em faixa de temperatura segura para reduzir paradas e refugos."],
    ["Vocês personalizam tensão e especificações ou fazem OEM?",
     "Sim. Somos fábrica de origem com capacidade de P&D e suportamos tensão personalizada (220V/380V/415V), refrigerante e produção OEM/marca própria conforme seu mercado."],
    ["Qual o prazo de entrega e pedido mínimo?",
     "Modelos padrão geralmente em 2–4 semanas; o prazo para unidades personalizadas depende das especificações. Pedido mínimo é flexível; fale conosco."],
    ["Como obtenho um orçamento?",
     "Envie pelo WhatsApp ou formulário o tipo de máquina, capacidade de resfriamento e tensão; dimensionamos o equipamento certo e enviamos orçamento em um dia útil."],
  ],
  zh: [
    ["{name} 是用来做什么的？",
     "{name} 为塑料注塑、挤出、激光等工业产线提供稳定工艺冷却，把设备控制在安全温度区间，减少停机与不良品。"],
    ["你们能定制电压/规格或做 OEM 吗？",
     "可以。我们是自有产线的源头工厂，具备研发能力，支持定制电压（220V/380V/415V）、冷媒，以及 OEM/贴牌生产以匹配你的市场。"],
    ["交期和起订量是多少？",
     "标准机型一般 2–4 周发货；定制机型交期视规格而定。起订量灵活，可针对你的项目沟通。"],
    ["怎么获取报价？",
     "通过 WhatsApp 或联系表单告诉我们机型、所需制冷量、电压，我们会帮你算准机型并在一个工作日内报价。"],
  ],
  de: [
    ["Wofür wird der {name} eingesetzt?",
     "Der {name} liefert stabile Prozesskühlung für Kunststoffspritzguss, Extrusion, Laser und andere Industrielinien und hält die Anlage in einem sicheren Temperaturbereich, um Stillstände und Ausschuss zu reduzieren."],
    ["Können Sie Spannung und Spezifikationen anpassen oder OEM anbieten?",
     "Ja. Wir sind Ersthersteller mit Entwicklungskompetenz und unterstützen individuelle Spannung (220V/380V/415V), Kältemittel sowie OEM/Private-Label-Fertigung für Ihren Markt."],
    ["Wie lang ist die Lieferzeit und die Mindestbestellmenge?",
     "Standardmodelle werden in der Regel innerhalb von 2–4 Wochen geliefert; die Zeit für Sonderausführungen hängt von den Spezifikationen ab. Die Mindestmenge ist flexibel — kontaktieren Sie uns."],
    ["Wie erhalte ich ein Angebot?",
     "Senden Sie uns Maschinentyp, benötigte Kälteleistung und Spannung per WhatsApp oder Kontaktformular; wir dimensionieren das passende Gerät und bieten innerhalb eines Werktags an."],
  ],
  fr: [
    ["À quoi sert le {name} ?",
     "Le {name} assure un refroidissement de procédé stable pour l'injection plastique, l'extrusion, le laser et d'autres lignes industrielles, maintenant l'équipement dans une plage de température sûre pour réduire les arrêts et les rebuts."],
    ["Pouvez-vous personnaliser la tension et les spécifications ou faire de l'OEM ?",
     "Oui. Nous sommes fabricant d'origine avec capacité R&D et proposons tension personnalisée (220V/380V/415V), fluide frigorigène et production OEM/marque blanche selon votre marché."],
    ["Quel est le délai de livraison et la commande minimale ?",
     "Les modèles standard sont généralement expédiés en 2–4 semaines ; le délai des unités personnalisées dépend des spécifications. La quantité minimale est flexible — contactez-nous."],
    ["Comment obtenir un devis ?",
     "Envoyez-nous par WhatsApp ou via le formulaire le type de machine, la puissance de refroidissement et la tension ; nous dimensionnons l'appareil adapté et vous soumettons un devis en un jour ouvré."],
  ],
  tr: [
    ["{name} ne için kullanılır?",
     "{name}, plastik enjeksiyon, ekstrüzyon, lazer ve diğer endüstriyel hatlar için stabil proses soğutması sağlayarak ekipmanı güvenli sıcaklık aralığında tutar, duruş ve fireyi azaltır."],
    ["Voltaj ve özellikleri özelleştiriyor musunuz veya OEM yapıyor musunuz?",
     "Evet. AR-GE kapasitesine sahip kaynak fabrikayız; 220V/380V/415V gibi özel voltaj, soğutucu akışkan ve pazarınıza uygun OEM/özel etiket üretimini destekliyoruz."],
    ["Teslim süresi ve minimum sipariş nedir?",
     "Standart modeller genellikle 2–4 hafta içinde gönderilir; özel ünitelerin süresi özelliklere bağlıdır. Minimum sipariş esnektir — bizimle iletişime geçin."],
    ["Nasıl teklif alırım?",
     "WhatsApp veya iletişim formu üzerinden makine tipinizi, gereken soğutma kapasitesini ve voltajı gönderin; doğru üniteyi boyutlandırıp bir iş günü içinde teklif veririz."],
  ],
  ru: [
    ["Для чего используется {name}?",
     "{name} обеспечивает стабильное технологическое охлаждение для литья пластика, экструзии, лазера и других промышленных линий, удерживая оборудование в безопасном температурном диапазоне и снижая простои и брак."],
    ["Можете ли вы настроить напряжение и характеристики или сделать OEM?",
     "Да. Мы завод-изготовитель с возможностями НИОКР и поддерживаем нестандартное напряжение (220В/380В/415В), хладагент и OEM/производство под вашим брендом."],
    ["Какой срок поставки и минимальный заказ?",
     "Стандартные модели обычно отгружаются за 2–4 недели; срок нестандартных установок зависит от характеристик. Минимальный заказ гибкий — свяжитесь с нами."],
    ["Как получить расчёт?",
     "Через WhatsApp или форму укажите тип машины, требуемую холодопроизводительность и напряжение; мы подберём нужный агрегат и дадим расчёт в течение одного рабочего дня."],
  ],
  ar: [
    ["لِمَ يُستخدم {name}؟",
     "يوفر {name} تبريداً مستقراً للعمليات في حقن البلاستيك والبثق والليزر وخطوط صناعية أخرى، ويبقي المعدات في مدى حرارة آمن لخفض التوقف والهدر."],
    ["هل يمكنكم تخصيص الجهد والمواصفات أو تصنيع OEM؟",
     "نعم. نحن مصنع مصدر بقدرة بحث وتطوير وندعم جهداً مخصصاً (220V/380V/415V) وغاز التبريد وإنتاج OEM/علامتكم الخاصة حسب سوقكم."],
    ["ما مدة التسليم والحد الأدنى للطلب؟",
     "تُشحن الطرز القياسية عادةً خلال 2–4 أسابيع؛ ومدة الوحدات المخصصة حسب المواصفات. الحد الأدنى مرن — تواصلوا معنا."],
    ["كيف أحصل على عرض سعر؟",
     "أرسلوا عبر واتساب أو نموذج الاتصال نوع الماكينة وقدرة التبريد المطلوبة والجهد؛ سنحدد الوحدة المناسبة ونرسل العرض خلال يوم عمل واحد."],
  ],
  id: [
    ["Untuk apa {name} digunakan?",
     "{name} memberikan pendinginan proses stabil untuk injeksi plastik, ekstrusi, laser, dan lini industri lainnya, menjaga peralatan dalam rentang suhu aman sehingga mengurangi berhenti dan cacat."],
    ["Apakah Anda bisa menyesuaikan tegangan dan spesifikasi atau membuat OEM?",
     "Ya. Kami pabrik sumber dengan kemampuan R&D dan mendukung tegangan khusus (220V/380V/415V), refrigeran, dan produksi OEM/label sendiri sesuai pasar Anda."],
    ["Berapa waktu pengiriman dan pesanan minimum?",
     "Model standar biasanya dikirim dalam 2–4 minggu; waktu unit khusus tergantung spesifikasi. Pesanan minimum fleksibel — hubungi kami."],
    ["Bagaimana cara mendapatkan penawaran?",
     "Kirimkan melalui WhatsApp atau formulir jenis mesin, kapasitas pendinginan, dan tegangan; kami akan menentukan unit yang tepat dan memberi penawaran dalam satu hari kerja."],
  ],
  vi: [
    ["{name} dùng để làm gì?",
     "{name} cung cấp làm mát quy trình ổn định cho ép phun nhựa, đùn, laser và các dây chuyền công nghiệp khác, giữ thiết bị trong dải nhiệt độ an toàn để giảm thời gian chết và phế phẩm."],
    ["Bạn có tùy chỉnh điện áp, thông số hoặc làm OEM không?",
     "Có. Chúng tôi là nhà máy nguồn có năng lực R&D, hỗ trợ điện áp tùy chỉnh (220V/380V/415V), môi chất lạnh và sản xuất OEM/theo thương hiệu riêng phù hợp thị trường của bạn."],
    ["Thời gian giao hàng và số lượng tối thiểu là bao nhiêu?",
     "Mẫu tiêu chuẩn thường giao trong 2–4 tuần; thời gian đơn tùy chỉnh tùy thông số. Số lượng tối thiểu linh hoạt — liên hệ với chúng tôi."],
    ["Làm sao để nhận báo giá?",
     "Gửi qua WhatsApp hoặc biểu mẫu loại máy, công suất làm mát và điện áp; chúng tôi sẽ tính đúng máy và báo giá trong một ngày làm việc."],
  ],
  th: [
    ["{name} ใช้ทำอะไร?",
     "{name} ให้การทำความเย็นกระบวนการที่เสถียรสำหรับการฉีดพลาสติก การอัดขึ้นรูป เลเซอร์ และสายการผลิตอุตสาหกรรมอื่น ๆ รักษาอุปกรณ์ในช่วงอุณหภูมิที่ปลอดภัย ลดเวลาหยุดและของเสีย"],
    ["คุณปรับแต่งแรงดันและสเปก หรือทำ OEM ได้ไหม?",
     "ได้ เราเป็นโรงงานต้นทางที่มีศักยภาพ R&D และรองรับแรงดันไฟฟ้าตามสั่ง (220V/380V/415V) สารทำความเย็น และผลิต OEM/ใต้แบรนด์คุณตามตลาด"],
    ["ระยะเวลาส่งและสั่งซื้อขั้นต่ำเป็นเท่าใด?",
     "รุ่นมาตรฐานมักส่งภายใน 2–4 สัปดาห์ ระยะเวลาสำหรับรุ่นสั่งทำขึ้นอยู่กับสเปก จำนวนสั่งขั้นต่ำยืดหยุ่น — ติดต่อเรา"],
    ["จะรับใบเสนอราคาได้อย่างไร?",
     "ส่งประเภทเครื่อง ความเย็นที่ต้องการ และแรงดันผ่าน WhatsApp หรือฟอร์มติดต่อ เราจะคำนวณเครื่องที่เหมาะสมและส่งใบเสนอราคาภายในหนึ่งวันทำการ"],
  ],
};

module.exports = { FAQ };
