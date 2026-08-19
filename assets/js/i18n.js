/* ============================================================
   QUEENS HIDRO - Internationalization
   Client-side translations for the public site.
   Product names and descriptions remain the catalog source text.
   ============================================================ */
(function () {
    'use strict';

    var LOCALES = { es: 'es-MX', en: 'en', ko: 'ko-KR' };
    var VALID = { es: true, en: true, ko: true };
    var entries = Object.create(null);
    var sourceToKey = Object.create(null);
    var textSources = typeof WeakMap === 'function' ? new WeakMap() : null;
    var attributeSources = typeof WeakMap === 'function' ? new WeakMap() : null;
    var internalTextNodes = typeof WeakSet === 'function' ? new WeakSet() : null;
    var internalAttributes = typeof WeakMap === 'function' ? new WeakMap() : null;
    var applying = false;
    var initialized = false;
    var observer = null;

    function normalize(value) {
        return String(value == null ? '' : value)
            .replace(/\u00a0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function add(key, es, en, ko) {
        entries[key] = { es: es, en: en, ko: ko };
        [es, en, ko].forEach(function (value) {
            if (value) sourceToKey[normalize(value)] = key;
        });
    }

    function addMany(list) {
        list.forEach(function (item) { add(item[0], item[1], item[2], item[3]); });
    }

    addMany([
        ['nav.shop', 'Tienda', 'Shop', '쇼핑'],
        ['nav.membership', 'Membresía', 'Membership', '멤버십'],
        ['nav.distribute', 'Distribuye Queens', 'Distribute Queens', 'Queens 유통'],
        ['nav.events', 'Eventos', 'Events', '이벤트'],
        ['nav.about', 'Nosotros', 'About us', '소개'],
        ['nav.services', 'Servicios', 'Services', '서비스'],
        ['nav.faqs', 'FAQs', 'FAQs', '자주 묻는 질문'],
        ['nav.more', 'Más', 'More', '더 보기'],
        ['nav.login', 'Entrar', 'Log in', '로그인'],
        ['nav.account', 'Mi cuenta', 'My account', '내 계정'],
        ['nav.logout', 'Cerrar sesión', 'Log out', '로그아웃'],
        ['nav.backShop', 'Volver a la tienda', 'Back to shop', '쇼핑으로 돌아가기'],
        ['nav.cart', 'Carrito', 'Cart', '장바구니'],
        ['nav.close', 'Cerrar', 'Close', '닫기'],
        ['nav.menu', 'Menú', 'Menu', '메뉴'],
        ['nav.language', 'Idioma', 'Language', '언어'],
        ['footer.legal', 'Legal', 'Legal', '법적 안내'],
        ['footer.explore', 'Explora', 'Explore', '둘러보기'],
        ['footer.follow', 'Síguenos', 'Follow us', '팔로우'],
        ['footer.rights', 'Todos los derechos reservados.', 'All rights reserved.', '모든 권리 보유'],
        ['footer.age', 'Prohibida la venta a menores de 18 años. Consume con responsabilidad.', 'Sale to anyone under 18 is prohibited. Please drink responsibly.', '18세 미만에게 주류를 판매할 수 없습니다. 책임감 있게 즐겨 주세요.'],
        ['footer.desc', 'Hidromiel artesanal de fruta real y miel mexicana. Cada botella apoya a los apicultores de Nuevo León.', 'Craft mead made with real fruit and Mexican honey. Every bottle supports beekeepers in Nuevo León.', '진짜 과일과 멕시코 꿀로 만든 수제 미드입니다. 한 병마다 누에보레온의 양봉가를 응원합니다.'],
        ['footer.descShort', 'Hidromiel artesanal de fruta real y miel mexicana. Apoyando a los apicultores de Nuevo León.', 'Craft mead made with real fruit and Mexican honey. Supporting beekeepers in Nuevo León.', '진짜 과일과 멕시코 꿀로 만든 수제 미드입니다. 누에보레온의 양봉가를 응원합니다.'],

        ['home.kicker', 'Fruta real · Miel mexicana · Hecho en MTY', 'Real fruit · Mexican honey · Made in MTY', '진짜 과일 · 멕시코 꿀 · MTY에서 제작'],
        ['home.heroMead', 'Hidromiel artesanal que', 'Craft mead that', '진짜 과일 맛이 나는'],
        ['home.heroRealFruit', 'sabe a fruta real.', 'tastes like real fruit.', '수제 미드'],
        ['home.heroHoney', 'Miel mexicana,', 'Mexican honey,', '멕시코 꿀의'],
        ['home.heroVibe', 'pura vibra.', 'pure good vibes.', '순수한 에너지.'],
        ['home.heroSub', 'Miel de Nuevo León y fruta real fermentada a mano. Se toma frío, se vive en grande.', 'Honey from Nuevo León and real fruit, fermented by hand. Best served cold and enjoyed boldly.', '누에보레온의 꿀과 진짜 과일을 손으로 발효했습니다. 차갑게 마시고 크게 즐겨 보세요.'],
        ['home.try', 'Quiero probarlo', 'I want to try it', '맛보고 싶어요'],
        ['home.viewShop', 'Ver la tienda', 'Visit the shop', '쇼핑몰 보기'],
        ['common.previous', 'Anterior', 'Previous', '이전'],
        ['common.next', 'Siguiente', 'Next', '다음'],
        ['ticker.realFruit', 'Fruta real', 'Real fruit', '진짜 과일'],
        ['ticker.honey', 'Miel mexicana', 'Mexican honey', '멕시코 꿀'],
        ['ticker.monterrey', 'Hecho en Monterrey', 'Made in Monterrey', '몬테레이에서 제작'],
        ['ticker.festival', 'Ediciones de festival', 'Festival editions', '페스티벌 에디션'],
        ['ticker.cold', 'Se toma frío', 'Best served cold', '차갑게 즐기기'],
        ['ticker.vibe', 'Pura vibra', 'Pure good vibes', '순수한 에너지'],
        ['home.outside', 'Fuera de lo común', 'Out of the ordinary', '평범함을 넘어'],
        ['home.unique', 'Una hidromiel única,', 'A one-of-a-kind mead,', '특별한 미드,'],
        ['home.liveIt', 'hecha para vivirla.', 'made to be lived.', '직접 경험하도록 만들었습니다.'],
        ['home.tribeSub', 'Fruta real, miel mexicana y fermentación artesanal: un sabor distinto que convierte cada brindis en una experiencia.', 'Real fruit, Mexican honey and craft fermentation: a distinctive flavor that turns every toast into an experience.', '진짜 과일, 멕시코 꿀, 수제 발효. 한 번의 건배를 특별한 경험으로 바꾸는 맛입니다.'],
        ['home.card1Alt', 'Brindis masivo', 'A crowd toast', '함께하는 건배'],
        ['home.card2Alt', 'Experiencia Queens', 'The Queens experience', 'Queens 경험'],
        ['home.card3Alt', 'Brindis nocturno', 'Nighttime toast', '밤의 건배'],
        ['home.card4Alt', 'Festival al aire libre', 'Outdoor festival', '야외 페스티벌'],
        ['home.card5Alt', 'Público vibrando', 'A crowd in the moment', '함께 즐기는 사람들'],
        ['home.card1', 'La banda reunida · Monterrey', 'The crew together · Monterrey', '함께 모인 사람들 · 몬테레이'],
        ['home.card2', 'Brindis que se recuerdan · Monterrey', 'Toasts worth remembering · Monterrey', '기억에 남는 건배 · 몬테레이'],
        ['home.card3', 'Noche de fruta real · Monterrey', 'A real-fruit night · Monterrey', '진짜 과일의 밤 · 몬테레이'],
        ['home.card4', 'Queens en modo festival · Monterrey', 'Queens in festival mode · Monterrey', '페스티벌 모드의 Queens · 몬테레이'],
        ['home.card5', 'La vibra se comparte · Monterrey', 'Good vibes are shared · Monterrey', '함께 나누는 에너지 · 몬테레이'],
        ['home.findUs', 'Encuéntranos', 'Find us', '매장에서 만나요'],
        ['home.meadNear', 'Hidromiel', 'Mead', '미드'],
        ['home.nearYou', 'cerca de ti', 'near you', '가까운 곳에서'],
        ['home.mapSub', 'Queens Hidro disponible en toda la zona metropolitana de Monterrey.', 'Queens Hidro is available across the Monterrey metropolitan area.', 'Queens Hidro는 몬테레이 광역 지역에서 만나볼 수 있습니다.'],
        ['stock.available', 'con stock', 'in stock', '재고 있음'],
        ['stock.unavailable', 'sin stock', 'out of stock', '품절'],

        ['shop.selection', 'Selección Queens', 'The Queens selection', 'Queens 셀렉션'],
        ['shop.our', 'Nuestro', 'Our', '우리의'],
        ['shop.mead', 'Hidromiel', 'Mead', '미드'],
        ['shop.sub', 'Ediciones que no se repiten, momentos que no se olvidan.', 'Limited editions, unforgettable moments.', '다시 반복되지 않는 에디션, 잊히지 않는 순간.'],
        ['shop.natural', '100% natural', '100% natural', '100% 천연'],
        ['shop.realFruit', 'Fruta real', 'Real fruit', '진짜 과일'],
        ['shop.mty', 'Monterrey, NL', 'Monterrey, NL', '몬테레이, NL'],
        ['shop.coverAlt', 'Selección Queens Hidro', 'Queens Hidro selection', 'Queens Hidro 셀렉션'],
        ['shop.loading', 'Cargando hidromieles...', 'Loading meads...', '미드를 불러오는 중...'],
        ['shop.experience', 'Experiencia Queens', 'The Queens experience', 'Queens 경험'],
        ['shop.tried', '¿Ya lo probaste?', 'Have you tried it?', '이미 맛보셨나요?'],
        ['shop.rate', 'Califícanos en Untappd', 'Rate us on Untappd', 'Untappd에서 평가해 주세요'],
        ['shop.rateSub', 'Comparte qué te pareció nuestro hidromiel y ayuda a que más gente viva la Experiencia Queens.', 'Tell us what you thought of our mead and help more people discover the Queens experience.', '우리 미드가 어땠는지 공유하고 더 많은 사람들이 Queens 경험을 만나도록 도와주세요.'],
        ['shop.empty', 'Tu carrito está vacío', 'Your cart is empty', '장바구니가 비어 있습니다'],
        ['shop.total', 'Total', 'Total', '합계'],
        ['shop.shipping', 'Envío', 'Shipping', '배송'],
        ['shop.checkout', 'Ir al carrito', 'Go to cart', '장바구니로 이동'],
        ['shop.continue', 'Seguir comprando', 'Continue shopping', '쇼핑 계속하기'],
        ['shop.secure', 'Pago seguro', 'Secure payment', '안전한 결제'],
        ['shop.cards', 'Tarjetas', 'Cards', '카드'],
        ['shop.transfer', 'Transferencia', 'Bank transfer', '계좌이체'],
        ['shop.explore', 'Explorar hidromieles', 'Explore meads', '미드 둘러보기'],
        ['shop.noProducts', 'No hay productos disponibles.', 'No products are available.', '현재 판매 가능한 제품이 없습니다.'],
        ['shop.loadError', 'Error al cargar:', 'Loading error:', '불러오기 오류:'],
        ['shop.soldOut', 'Agotado', 'Sold out', '품절'],
        ['shop.add', 'Agregar al carrito', 'Add to cart', '장바구니에 담기'],
        ['shop.details', 'Ver detalles', 'View details', '상세 보기'],
        ['shop.priceUnavailable', 'Precio no disponible', 'Price unavailable', '가격 정보 없음'],
        ['shop.quantity', 'Cantidad:', 'Quantity:', '수량:'],
        ['shop.alcohol', '% alc', '% ABV', '% 알코올'],
        ['shop.each', 'c/u', 'each', '개당'],
        ['shop.outNow', 'Agotado por el momento', 'Temporarily sold out', '현재 품절'],
        ['shop.stockRemoved', 'Agotado — se quitará al pagar', 'Sold out - it will be removed at checkout', '품절되었습니다. 결제 전에 장바구니에서 삭제됩니다.'],
        ['shop.added', 'Agregado al carrito', 'Added to cart', '장바구니에 담았습니다'],
        ['shop.remove', 'Eliminar', 'Remove', '삭제'],
        ['shop.increase', 'Aumentar', 'Increase', '늘리기'],
        ['shop.decrease', 'Disminuir', 'Decrease', '줄이기'],
        ['shop.subscribeCta', 'Suscríbete y paga', 'Join the membership and pay', '멤버십에 가입하면'],

        ['membership.titleTag', 'Suscripción mensual', 'Monthly membership', '월간 멤버십'],
        ['membership.mead', 'Hidromiel', 'Mead', '미드'],
        ['membership.door', 'a tu puerta', 'at your door', '집 앞까지'],
        ['membership.sub', 'Elige tus botellas al mes y te las llevamos a la puerta. Envío incluido en zona MTY.', 'Choose your monthly bottles and we will bring them to your door. Shipping included in the MTY area.', '매달 원하는 병을 고르면 집 앞까지 보내 드립니다. MTY 지역 배송비 포함.'],
        ['membership.shippingIncluded', 'Envío incluido', 'Shipping included', '배송비 포함'],
        ['membership.prepaidMonthly', 'Prepago o mensual', 'Prepaid or monthly', '선불 또는 월간'],
        ['membership.mtyArea', 'Zona MTY', 'MTY area', 'MTY 지역'],
        ['membership.coverAlt', 'Hidromiel a tu puerta', 'Mead at your door', '집 앞까지 오는 미드'],
        ['auth.loginTab', 'Iniciar Sesión', 'Log in', '로그인'],
        ['auth.registerTab', 'Registrarse', 'Create account', '회원가입'],
        ['auth.email', 'Correo electrónico', 'Email address', '이메일'],
        ['auth.password', 'Contraseña', 'Password', '비밀번호'],
        ['auth.fullName', 'Nombre completo', 'Full name', '성명'],
        ['auth.namePlaceholder', 'Tu nombre', 'Your name', '이름'],
        ['auth.passwordMin', 'Mínimo 6 caracteres', 'At least 6 characters', '최소 6자'],
        ['auth.enter', 'Entrar', 'Log in', '로그인'],
        ['auth.create', 'Crear cuenta', 'Create account', '계정 만들기'],
        ['auth.loading', 'Ingresando...', 'Logging in...', '로그인 중...'],
        ['auth.creating', 'Creando cuenta...', 'Creating account...', '계정 생성 중...'],
        ['auth.invalid', 'Correo o contraseña incorrectos.', 'Incorrect email or password.', '이메일 또는 비밀번호가 올바르지 않습니다.'],
        ['auth.exists', 'Ya existe una cuenta con este correo. Inicia sesión.', 'An account already exists with this email. Log in instead.', '이 이메일로 이미 계정이 있습니다. 로그인해 주세요.'],
        ['auth.created', 'Cuenta creada. Revisa tu correo para confirmar tu email.', 'Account created. Check your email to confirm your address.', '계정이 생성되었습니다. 이메일을 확인해 주소를 인증해 주세요.'],
        ['auth.home', 'Ir al inicio', 'Go home', '홈으로'],
        ['auth.dashboardLogout', 'Cerrar sesión', 'Log out', '로그아웃'],
        ['membership.loading', 'Cargando planes...', 'Loading plans...', '플랜을 불러오는 중...'],
        ['membership.active', '¡Ya tienes suscripción activa!', 'You already have an active membership!', '이미 활성 멤버십이 있습니다!'],
        ['membership.pending', 'Tu suscripción está pendiente de confirmación', 'Your membership is pending confirmation', '멤버십 확인이 진행 중입니다'],
        ['membership.confirming', 'Estamos confirmando tu pago; en cuanto quede listo te avisamos.', 'We are confirming your payment and will let you know as soon as it is ready.', '결제를 확인하고 있습니다. 완료되는 대로 알려 드리겠습니다.'],
        ['membership.account', 'Ir a mi cuenta', 'Go to my account', '내 계정으로 이동'],
        ['membership.plan', 'Plan', 'Plan', '플랜'],
        ['membership.monthlyRenewable', 'mensual renovable', 'monthly, renewable', '월간 자동 갱신'],
        ['membership.renewable', 'renovable', 'renewable', '자동 갱신'],
        ['membership.nextCharge', 'Siguiente cargo', 'Next charge', '다음 결제'],
        ['membership.commitment', 'Compromiso hasta', 'Commitment through', '약정 종료일'],
        ['membership.shipTo', 'Envío a', 'Shipping to', '배송지'],
        ['membership.errorPlans', 'Error al cargar planes.', 'Could not load plans.', '플랜을 불러오지 못했습니다.'],
        ['membership.noPlans', 'No hay planes disponibles.', 'No plans are available.', '현재 이용 가능한 플랜이 없습니다.'],
        ['membership.prepaid', 'Prepago', 'Prepaid', '선불'],
        ['membership.basePrice', 'precio base', 'base price', '기본 가격'],
        ['membership.recurringZone', 'Solo disponible en Monterrey y área metropolitana. Envío flat de ${shipping} incluido en cada entrega. Cargo mensual recurrente de ${total} MXN. Cancela cuando quieras. Con tu suscripción, tus pedidos sueltos de la tienda también pagan solo $150 de envío (en vez de $199).', 'Available only in Monterrey and the metropolitan area. A flat ${shipping} shipping fee is included with each delivery. Recurring monthly charge of ${total} MXN. Cancel anytime. With your membership, standalone shop orders also pay only $150 shipping instead of $199.', '몬테레이 및 광역 지역에서만 이용 가능합니다. 매 배송에 ${shipping} 정액 배송비가 포함됩니다. 월간 정기 결제는 ${total} MXN입니다. 언제든 취소할 수 있습니다. 멤버십 회원은 단품 주문도 $199 대신 $150의 배송비만 지불합니다.'],
        ['membership.prepaidZone', 'Solo disponible en Monterrey y área metropolitana. Envío flat de ${shipping} incluido en cada entrega mensual. Pago único por adelantado. Con tu suscripción, tus pedidos sueltos de la tienda también pagan solo $150 de envío (en vez de $199).', 'Available only in Monterrey and the metropolitan area. A flat ${shipping} shipping fee is included with each monthly delivery. One-time payment in advance. With your membership, standalone shop orders also pay only $150 shipping instead of $199.', '몬테레이 및 광역 지역에서만 이용 가능합니다. 매월 배송에 ${shipping} 정액 배송비가 포함됩니다. 선불 일시 결제입니다. 멤버십 회원은 단품 주문도 $199 대신 $150의 배송비만 지불합니다.'],
        ['membership.savingTotal', '-${value} total', '-${value} total', '총 -${value} 절약'],
        ['membership.savingMonth', '-${value} /mes', '-${value} /month', '-${value} /월'],
        ['membership.savingsVs', 'vs ${value} c/u sin suscripción', 'vs ${value} each without membership', '멤버십 없이 ${value} 개당 대비'],
        ['membership.subscribeMonthly', 'Suscribirme mensualmente · ${value} MXN/mes', 'Join monthly · ${value} MXN/month', '월간 가입 · ${value} MXN/월'],
        ['membership.subscribePrepaid', 'Suscribirme · ${value} MXN', 'Join · ${value} MXN', '가입 · ${value} MXN'],
        ['membership.prepaidSaving', 'Ahorras ${value} vs pagar mes a mes', 'Save ${value} vs paying month to month', '월간 결제보다 ${value} 절약'],
        ['membership.discountUpTo', 'Hasta {value}% de descuento', 'Up to {value}% off', '최대 {value}% 할인'],
        ['membership.monthly', 'Suscripción mensual', 'Monthly membership', '월간 멤버십'],
        ['membership.monthlyDiscount', '{value}% desc · cancela cuando quieras', '{value}% off · cancel anytime', '{value}% 할인 · 언제든 취소 가능'],
        ['membership.chooseBottles', '¿Cuántas botellas quieres al mes?', 'How many bottles do you want each month?', '한 달에 몇 병을 원하시나요?'],
        ['membership.chooseAmount', '— Elige cantidad —', '— Choose a quantity —', '— 수량 선택 —'],
        ['membership.savingsPlaceholder', 'Ahorras XX%', 'Save XX%', 'XX% 절약'],
        ['membership.vsPlaceholder', 'vs $0 c/u sin suscripción', 'vs $0 each without membership', '멤버십 없이 병당 $0 대비'],
        ['membership.monthPrice', 'MXN / mes (envío incluido)', 'MXN / month (shipping included)', 'MXN /월 (배송비 포함)'],
        ['membership.savings', 'Ahorras {value}%', 'Save {value}%', '{value}% 절약'],
        ['membership.vsRegular', 'vs ${value} c/u sin suscripción', 'vs ${value} each without membership', '멤버십 없이 병당 ${value} 대비'],
        ['membership.withMembership', 'con suscripción:', 'with membership:', '멤버십 가격:'],
        ['membership.normal', 'normal:', 'regular:', '일반 가격:'],
        ['membership.perBottle', 'c/botella', 'per bottle', '병당'],
        ['membership.chooseMonths', '¿Por cuántos meses?', 'For how many months?', '몇 개월 이용하시겠어요?'],
        ['membership.prepaidTotal', 'Total prepago', 'Prepaid total', '선불 합계'],
        ['membership.shippingData', 'Datos de envío', 'Shipping details', '배송 정보'],
        ['membership.municipality', 'Municipio', 'Municipality', '시/군'],
        ['membership.chooseMunicipality', 'Selecciona tu municipio', 'Select your municipality', '지역을 선택하세요'],
        ['membership.address', 'Dirección completa', 'Full address', '상세 주소'],
        ['membership.addressPlaceholder', 'Calle, número, colonia, CP...', 'Street, number, neighborhood, postal code...', '도로명, 번지, 지역, 우편번호...'],
        ['membership.zoneNote', 'Solo disponible en Monterrey y área metropolitana. Envío flat de $150 incluido en cada entrega mensual. Pago único por adelantado. Con tu suscripción, tus pedidos sueltos de la tienda también pagan solo $150 de envío (en vez de $199).', 'Available only in Monterrey and the metropolitan area. A flat $150 shipping fee is included with each monthly delivery. One-time payment in advance. With your membership, standalone shop orders also pay only $150 shipping instead of $199.', '몬테레이 및 광역 지역에서만 이용 가능합니다. 매월 배송에 $150 정액 배송비가 포함됩니다. 선불 일시 결제입니다. 멤버십 회원은 쇼핑몰의 단품 주문도 $199 대신 $150의 배송비만 지불합니다.'],
        ['membership.bottles', 'Botellas', 'Bottles', '병 수'],
        ['membership.priceBottle', 'Precio por botella', 'Price per bottle', '병당 가격'],
        ['membership.savingsLabel', 'Ahorro', 'Savings', '절약'],
        ['membership.monthlyLabel', 'Mensual', 'Monthly', '월간'],
        ['membership.duration', 'Duración', 'Duration', '기간'],
        ['membership.subscribe', 'Suscribirme', 'Join now', '멤버십 가입'],
        ['membership.loginToSubscribe', 'Inicia sesión para suscribirte', 'Log in to join', '가입하려면 로그인하세요'],
        ['membership.monthByMonth', 'Mes a mes · cancela cuando quieras', 'Month to month · cancel anytime', '월 단위 · 언제든 취소 가능'],
        ['membership.monthlyCharge', 'Cargo mensual', 'Monthly charge', '월간 결제'],
        ['membership.extraPrepaid', 'Ahorras {value}% extra por prepago', 'Save an extra {value}% with prepayment', '선불 결제로 {value}% 추가 절약'],
        ['membership.saveVsMonthly', 'Ahorras ${value} vs pagar mes a mes', 'Save ${value} vs paying month to month', '월간 결제보다 ${value} 절약'],
        ['membership.selectPlan', 'Selecciona un plan', 'Select a plan', '플랜을 선택하세요'],
        ['membership.completeFields', 'Completa todos los campos', 'Complete all fields', '모든 항목을 입력하세요'],
        ['membership.municipalityArea', 'El municipio debe estar en el área metropolitana de Monterrey', 'The municipality must be in the Monterrey metropolitan area', '해당 지역은 몬테레이 광역 지역이어야 합니다'],
        ['membership.creating', 'Creando suscripción...', 'Creating membership...', '멤버십 생성 중...'],
        ['membership.paymentFailed', 'Pago no completado. Puedes intentarlo de nuevo.', 'Payment was not completed. You can try again.', '결제가 완료되지 않았습니다. 다시 시도해 주세요.'],
        ['membership.confirmPayment', 'Estamos confirmando tu pago...', 'We are confirming your payment...', '결제를 확인하고 있습니다...'],
        ['membership.createError', 'No se pudo crear la suscripción', 'The membership could not be created', '멤버십을 생성하지 못했습니다'],

        ['dist.tag', 'Degustación Queens', 'Queens tasting', 'Queens 시음'],
        ['dist.coverAlt', 'Distribuye Queens Hidro', 'Distribute Queens Hidro', 'Queens Hidro 유통'],
        ['dist.title', 'Prueba Queens en tu negocio', 'Try Queens at your business', '매장에서 Queens를 만나 보세요'],
        ['dist.sub', 'Primero probamos. Después platicamos sobre la mejor forma de trabajar juntos.', 'We taste first. Then we talk about the best way to work together.', '먼저 맛보고, 함께할 수 있는 가장 좋은 방법을 이야기합니다.'],
        ['dist.text', 'Cuéntanos sobre tu negocio y lo que quieres construir. Nosotros te escuchamos, probamos juntos y vemos el siguiente paso.', 'Tell us about your business and what you want to build. We listen, taste together and decide on the next step.', '매장과 만들고 싶은 경험을 알려 주세요. 함께 맛보고 다음 단계를 찾아봅니다.'],
        ['dist.tasting', 'Degustación Queens', 'Queens tasting', 'Queens 시음'],
        ['dist.firstTaste', 'Primero probamos.', 'We taste first.', '먼저 맛봅니다.'],
        ['dist.tastingCopy', 'Elige cómo quieres conocer Queens. La fecha es tentativa: revisamos tu solicitud y te confirmamos personalmente.', 'Choose how you would like to discover Queens. The date is tentative: we review your request and confirm it personally.', 'Queens를 만나는 방법을 선택하세요. 날짜는 임시 일정이며 신청서를 검토한 뒤 직접 확정해 드립니다.'],
        ['dist.inPerson', '01 · En persona', '01 · In person', '01 · 방문 시음'],
        ['dist.visit', 'Visita en tu negocio', 'Visit at your business', '매장 방문'],
        ['dist.mtyArea', 'Monterrey y área metropolitana.', 'Monterrey and the metropolitan area.', '몬테레이 및 광역 지역'],
        ['dist.remote', '02 · A distancia', '02 · Remote', '02 · 원격'],
        ['dist.kit', 'Kit sin costo', 'Complimentary kit', '무료 키트'],
        ['dist.national', 'Solicita una degustación desde cualquier parte de México.', 'Request a tasting from anywhere in Mexico.', '멕시코 어디서든 시음을 신청하세요.'],
        ['dist.tastingType', 'Tipo de degustación', 'Tasting type', '시음 방식'],
        ['dist.calendarAria', 'Calendario de degustación', 'Tasting calendar', '시음 일정 달력'],
        ['dist.formatAria', 'Formato de distribución', 'Distribution format', '유통 형태'],
        ['dist.prevMonth', 'Mes anterior', 'Previous month', '이전 달'],
        ['dist.nextMonth', 'Mes siguiente', 'Next month', '다음 달'],
        ['dist.calendarNoteLocal', 'Elige una fecha tentativa con al menos 7 días de anticipación. Te contactaremos para confirmar.', 'Choose a tentative date at least 7 days in advance. We will contact you to confirm.', '최소 7일 전에 임시 날짜를 선택해 주세요. 확인을 위해 연락드리겠습니다.'],
        ['dist.calendarNoteNational', 'Elige cuándo te gustaría recibirla. La fecha es tentativa y la solicitud queda sujeta a revisión.', 'Choose when you would like to receive it. The date is tentative and the request is subject to review.', '받고 싶은 날짜를 선택하세요. 날짜는 임시 일정이며 신청서 검토 후 확정됩니다.'],
        ['dist.localCopy', 'Elige una fecha tentativa para visitarte. Revisamos tu solicitud y te confirmamos personalmente.', 'Choose a tentative date for our visit. We review your request and confirm it personally.', '방문을 위한 임시 날짜를 선택하세요. 신청서를 검토한 뒤 직접 확정해 드립니다.'],
        ['dist.nationalCopy', 'Cuéntanos dónde estás y cuándo te gustaría recibirla. Revisamos tu solicitud antes de enviar producto.', 'Tell us where you are and when you would like to receive it. We review your request before sending the product.', '어디에 계시고 언제 받고 싶은지 알려 주세요. 제품을 보내기 전에 신청서를 검토합니다.'],
        ['dist.selectedDate', 'Fecha tentativa: {date}', 'Tentative date: {date}', '임시 날짜: {date}'],
        ['dist.noDate', 'Aún no has elegido una fecha.', 'You have not chosen a date yet.', '아직 날짜를 선택하지 않았습니다.'],
        ['dist.business', 'Cuéntanos de tu negocio', 'Tell us about your business', '매장 정보를 알려 주세요'],
        ['dist.nationalRequest', 'Solicita tu degustación', 'Request your tasting', '시음을 신청하세요'],
        ['dist.businessSub', 'Necesitamos estos datos para revisar la visita y entender qué estás buscando.', 'We need these details to review the visit and understand what you are looking for.', '방문을 검토하고 원하는 내용을 이해하기 위해 필요한 정보입니다.'],
        ['dist.nationalSub', 'Primero recibimos tu solicitud. Revisaremos el caso y te contactaremos para confirmar el siguiente paso.', 'We receive your request first. We will review it and contact you to confirm the next step.', '먼저 신청서를 확인합니다. 검토 후 다음 단계를 확정하기 위해 연락드리겠습니다.'],
        ['dist.municipality', 'Municipio', 'Municipality', '시/군'],
        ['dist.chooseMunicipality', 'Selecciona tu municipio', 'Select your municipality', '지역을 선택하세요'],
        ['dist.state', 'Estado', 'State', '주/도'],
        ['dist.city', 'Ciudad / municipio', 'City / municipality', '도시 / 시·군'],
        ['dist.yourState', 'Tu estado', 'Your state', '주/도'],
        ['dist.yourCity', 'Tu ciudad', 'Your city', '도시'],
        ['dist.name', 'Tu nombre', 'Your name', '이름'],
        ['dist.fullName', 'Nombre completo', 'Full name', '성명'],
        ['dist.email', 'Correo', 'Email', '이메일'],
        ['dist.phone', 'Teléfono / WhatsApp', 'Phone / WhatsApp', '전화 / WhatsApp'],
        ['dist.businessName', 'Nombre de tu negocio', 'Business name', '매장 이름'],
        ['dist.businessPlaceholder', 'Nombre del negocio', 'Business name', '매장 이름'],
        ['dist.volume', 'Volumen que te gustaría explorar', 'Volume you would like to explore', '희망 물량'],
        ['dist.volumePlaceholder', 'Ej. compra semanal, mensual o cantidad aproximada', 'E.g. weekly or monthly purchase, or an approximate quantity', '예: 주간·월간 구매량 또는 예상 수량'],
        ['dist.format', '¿Qué formato te interesa?', 'Which format interests you?', '어떤 형태에 관심이 있나요?'],
        ['dist.bottle', 'Botella', 'Bottle', '병'],
        ['dist.barrel', 'Barril', 'Keg', '케그'],
        ['dist.bottleHint', 'Botella — cuéntanos qué formato imaginas para tu negocio.', 'Bottle - tell us what format you imagine for your business.', '병 - 매장에 어떤 형태로 선보이고 싶은지 알려 주세요.'],
        ['dist.barrelHint', 'Barril — cuéntanos cómo te gustaría servir Queens.', 'Keg - tell us how you would like to serve Queens.', '케그 - Queens를 어떻게 제공하고 싶은지 알려 주세요.'],
        ['dist.notes', 'Notas', 'Notes', '메모'],
        ['dist.optional', 'opcional', 'optional', '선택 사항'],
        ['dist.notesPlaceholder', 'Cuéntanos qué te gustaría probar...', 'Tell us what you would like to try...', '어떤 제품을 맛보고 싶은지 알려 주세요...'],
        ['dist.requestVisit', 'Solicitar visita', 'Request a visit', '방문 신청'],
        ['dist.requestTasting', 'Solicitar degustación', 'Request a tasting', '시음 신청'],
        ['dist.success', 'Recibimos tu solicitud. Te contactaremos para confirmar el siguiente paso.', 'We received your request. We will contact you to confirm the next step.', '신청서를 받았습니다. 다음 단계를 확정하기 위해 연락드리겠습니다.'],
        ['dist.send', 'Enviando...', 'Sending...', '전송 중...'],
        ['dist.sent', 'Solicitud enviada', 'Request sent', '신청 완료'],
        ['dist.businessTalk', 'Para tu negocio', 'For your business', '매장을 위해'],
        ['dist.contactTitle', 'Una conversación que empieza con una prueba', 'A conversation that starts with a tasting', '시음으로 시작하는 대화'],
        ['dist.contactSub', 'Una conversación directa para entender tu negocio y encontrar la forma correcta de llevar Queens a tu comunidad.', 'A direct conversation to understand your business and find the right way to bring Queens to your community.', '매장을 이해하고 Queens를 커뮤니티에 선보일 가장 좋은 방법을 찾는 직접적인 대화입니다.'],
        ['dist.feat1Title', 'Platicamos primero', 'We talk first', '먼저 이야기합니다'],
        ['dist.feat1Desc', 'Entendemos tu negocio antes de proponerte una forma de trabajar.', 'We understand your business before proposing a way to work together.', '함께할 방법을 제안하기 전에 매장을 먼저 이해합니다.'],
        ['dist.feat2Title', 'Prueba sin presión', 'Taste without pressure', '부담 없는 시음'],
        ['dist.feat2Desc', 'Conoce Queens y descubre qué experiencia hace sentido para tu comunidad.', 'Discover Queens and find the experience that makes sense for your community.', 'Queens를 만나고 커뮤니티에 어울리는 경험을 찾아보세요.'],
        ['dist.feat3Title', 'Impacto real', 'Real impact', '진짜 영향'],
        ['dist.feat3Desc', 'Cada conversación puede abrir una nueva forma de apoyar a los apicultores de Nuevo León.', 'Every conversation can open a new way to support beekeepers in Nuevo León.', '모든 대화가 누에보레온의 양봉가를 응원하는 새로운 방법이 될 수 있습니다.'],

        ['events.tag', 'Próximos eventos', 'Upcoming events', '다가오는 이벤트'],
        ['events.title', '¿Dónde nos vemos?', 'Where will we see you?', '어디서 만날까요?'],
        ['events.sub', 'Estamos preparando nuevas fechas. Muy pronto te contaremos dónde nos vemos.', 'We are preparing new dates. We will soon tell you where to find us.', '새로운 일정을 준비하고 있습니다. 곧 어디서 만날 수 있는지 알려 드릴게요.'],
        ['events.empty', 'Próximos eventos por anunciar...', 'Upcoming events to be announced...', '예정된 이벤트를 곧 알려 드립니다...'],
        ['events.emptyNote', 'Estamos preparando nuestras próximas fechas. Vuelve pronto para conocerlas.', 'We are preparing our next dates. Come back soon to see them.', '다음 일정을 준비하고 있습니다. 곧 다시 확인해 주세요.'],
        ['events.stayTuned', 'Mantente pendiente', 'Stay tuned', '계속 지켜봐 주세요'],
        ['events.stayText', 'Publicaremos aquí nuestras próximas fechas confirmadas.', 'We will publish our next confirmed dates here.', '확정된 다음 일정을 이곳에 게시하겠습니다.'],

        ['about.tag', 'Nosotros', 'About us', '소개'],
        ['about.hive', 'De la colmena', 'From the hive', '벌통에서'],
        ['about.party', 'a tu fiesta', 'to your celebration', '당신의 축제까지'],
        ['about.sub', 'Trabajamos con los mejores apicultores de la región.', 'We work with the best beekeepers in the region.', '지역 최고의 양봉가들과 함께합니다.'],
        ['about.tribe', 'La experiencia Queens', 'The Queens experience', 'Queens 경험'],
        ['about.realToast', 'Brindis reales. Comunidad real.', 'Real toasts. Real community.', '진짜 건배. 진짜 커뮤니티.'],
        ['about.intro', 'Momentos de la gente que convierte cada botella en parte de la fiesta. Sube tus fotos y videos desde el admin para que la próxima historia sea la tuya.', 'Moments from the people who make every bottle part of the celebration. Upload your photos and videos in the admin so the next story can be yours.', '한 병 한 병을 축제의 일부로 만드는 사람들의 순간입니다. 관리자에서 사진과 영상을 올려 다음 이야기의 주인공이 되어 보세요.'],
        ['about.previousContent', 'Contenido anterior', 'Previous content', '이전 콘텐츠'],
        ['about.nextContent', 'Contenido siguiente', 'Next content', '다음 콘텐츠'],
        ['about.pause', 'Pausar', 'Pause', '일시정지'],
        ['about.resume', 'Reanudar', 'Resume', '재생'],
        ['about.emptyTitle', 'La próxima ronda es tuya.', 'The next round is yours.', '다음 라운드는 당신의 차례입니다.'],
        ['about.emptyText', 'Muy pronto verás aquí fotos y videos de la comunidad Queens.', 'You will soon see photos and videos from the Queens community here.', '곧 Queens 커뮤니티의 사진과 영상을 이곳에서 만나 보세요.'],
        ['about.orderYours', 'Pide la tuya', 'Order yours', '나만의 한 병 주문하기'],
        ['about.movingTribe', 'La experiencia en movimiento', 'The experience in motion', '움직이는 경험'],
        ['about.toastTitle', 'Un brindis que se antoja', 'A toast you will crave', '마시고 싶은 건배'],
        ['about.videoAlt', 'Video de la comunidad Queens', 'Queens community video', 'Queens 커뮤니티 영상'],
        ['about.communityAlt', 'Comunidad Queens brindando', 'Queens community toasting', '건배하는 Queens 커뮤니티'],
        ['about.history', 'Nuestra historia', 'Our story', '우리의 이야기'],
        ['about.honeyHere', 'Miel de aquí, brindis de todos.', 'Honey from here, toasts for everyone.', '이곳의 꿀, 모두의 건배.'],
        ['about.faqTitle', 'Preguntas Frecuentes', 'Frequently Asked Questions', '자주 묻는 질문'],
        ['about.whatMead', '¿Qué es el hidromiel?', 'What is mead?', '미드란 무엇인가요?'],
        ['about.whatMeadAnswer', 'La bebida fermentada más antigua del mundo: miel, agua y levadura. Nosotros la hacemos con miel 100% mexicana y un toque moderno.', 'The oldest fermented drink in the world: honey, water and yeast. We make ours with 100% Mexican honey and a modern touch.', '세계에서 가장 오래된 발효 음료입니다. 꿀, 물, 효모로 만듭니다. 우리는 100% 멕시코 꿀과 현대적인 감각을 더합니다.'],
        ['about.whatMeadFull', 'La bebida fermentada más antigua del mundo: miel, agua y levadura. Nosotros la hacemos con miel 100% mexicana y un toque moderno. Suave, aromática y hecha para brindar.', 'The oldest fermented drink in the world: honey, water and yeast. We make ours with 100% Mexican honey and a modern touch. Smooth, aromatic and made for toasting.', '세계에서 가장 오래된 발효 음료입니다. 꿀, 물, 효모로 만듭니다. 우리는 100% 멕시코 꿀과 현대적인 감각을 더해 부드럽고 향긋하게 만듭니다.'],
        ['about.abvQuestion', '¿Cuánto alcohol tiene Queens Hidro?', 'How much alcohol does Queens Hidro contain?', 'Queens Hidro의 알코올 도수는 얼마인가요?'],
        ['about.abvAnswer', 'Entre 5% y 8%, según la variedad. Perfecto para festival o tarde con la banda.', 'Between 5% and 8%, depending on the variety. Perfect for a festival or an afternoon with friends.', '제품에 따라 5%에서 8%입니다. 페스티벌이나 친구들과의 오후에 잘 어울립니다.'],
        ['about.shippingQuestion', '¿Hacen envíos a todo México?', 'Do you ship throughout Mexico?', '멕시코 전역으로 배송하나요?'],
        ['about.shippingAnswer', 'Sí. Enviamos a toda la República en 24-48 horas. También tenemos puntos de venta en MTY. ¿Quieres distribuir? Visita', 'Yes. We ship throughout Mexico in 24-48 hours. We also have points of sale in MTY. Want to distribute? Visit', '네. 멕시코 전역으로 24~48시간 내 배송합니다. MTY에도 판매처가 있습니다. 유통을 원하시나요? 다음을 방문하세요:'],
        ['about.sellQuestion', '¿Cómo puedo vender Queens Hidro en mi bar o restaurante?', 'How can I sell Queens Hidro at my bar or restaurant?', '바나 레스토랑에서 Queens Hidro를 판매하려면 어떻게 하나요?'],
        ['about.sellAnswer', '¡Nos encanta! Visita', 'We would love that! Visit', '좋은 생각입니다! 다음을 방문해'],
        ['about.sellAnswerRest', 'y te damos precio por volumen, envíos a todo México y todo para recibir a la comunidad en tu establecimiento.', 'and we will share volume pricing, nationwide shipping and everything you need to welcome the community to your establishment.', '물량별 가격, 멕시코 전역 배송 및 매장에서 커뮤니티를 맞이하는 데 필요한 내용을 안내해 드립니다.'],
        ['about.membershipQuestion', '¿Qué incluye la membresía?', 'What does the membership include?', '멤버십에는 무엇이 포함되나요?'],
        ['about.membershipAnswer', 'Ediciones limitadas, descuentos, preventa de eventos y contenido exclusivo. Tres niveles: Experiencia, Gold y Legend. Más info en', 'Limited editions, discounts, event presales and exclusive content. Three levels: Experience, Gold and Legend. More info at', '한정 에디션, 할인, 이벤트 사전 판매 및 독점 콘텐츠가 포함됩니다. Experience, Gold, Legend 세 단계가 있습니다. 자세한 내용:'],

        ['services.studio', 'Estudio creativo', 'Creative studio', '크리에이티브 스튜디오'],
        ['services.brand', 'Tu marca, pero', 'Your brand, but', '당신의 브랜드를'],
        ['services.alive', 'más viva.', 'more alive.', '더 생생하게.'],
        ['services.headerSub', 'Lo que hacemos para Queens Hidro, ahora para hacer que tu proyecto se sienta imposible de ignorar.', 'What we do for Queens Hidro, now helping your project become impossible to ignore.', 'Queens Hidro를 위해 하는 일을 이제 당신의 프로젝트에도 적용해 잊을 수 없는 브랜드를 만듭니다.'],
        ['services.identity', 'Identidad', 'Identity', '아이덴티티'],
        ['services.web', 'Web', 'Web', '웹'],
        ['services.content', 'Contenido', 'Content', '콘텐츠'],
        ['services.noSmoke', 'Sin humo', 'No fluff', '허세 없이'],
        ['services.workTalks', 'El trabajo habla', 'The work speaks', '결과가 말합니다'],
        ['services.sketch', 'Del primer boceto al', 'From the first sketch to the', '첫 스케치부터'],
        ['services.pixel', 'último pixel.', 'last pixel.', '마지막 픽셀까지.'],
        ['services.intro', 'Una buena idea no se queda en una carpeta. La convertimos en una identidad que se reconoce, una experiencia que se disfruta y contenido que da ganas de compartir.', 'A good idea should not stay in a folder. We turn it into a recognizable identity, an enjoyable experience and content people want to share.', '좋은 아이디어는 폴더 안에 머물지 않습니다. 알아볼 수 있는 아이덴티티, 즐거운 경험, 공유하고 싶은 콘텐츠로 만듭니다.'],
        ['services.portfolio', 'Portafolio en movimiento', 'Portfolio in motion', '움직이는 포트폴리오'],
        ['services.identityTags', 'Identidad / Etiquetas', 'Identity / Labels', '아이덴티티 / 라벨'],
        ['services.findYou', 'Que te ubiquen', 'Be recognized', '한눈에 알아보게'],
        ['services.beforeTaste', 'antes de probarte.', 'before they taste you.', '맛보기 전부터.'],
        ['services.packaging', 'Packaging, sistema visual y detalles que hacen que tu producto pida su propio espacio en la barra.', 'Packaging, visual systems and details that make your product ask for its own space at the bar.', '패키징, 비주얼 시스템, 그리고 바에서 제품만의 자리를 만들어 주는 디테일.'],
        ['services.branding', 'Branding', 'Branding', '브랜딩'],
        ['services.packagingTag', 'Packaging', 'Packaging', '패키징'],
        ['services.artDirection', 'Dirección de arte', 'Art direction', '아트 디렉션'],
        ['services.campaign', 'Campaña / Dirección de arte', 'Campaign / Art direction', '캠페인 / 아트 디렉션'],
        ['services.conversation', 'Diseño que se mete', 'Design that joins', '대화에 들어가는'],
        ['services.conversationEnd', 'en la conversación.', 'the conversation.', '디자인.'],
        ['services.campaignCopy', 'Del menú al flyer, construimos piezas con una sola voz para que tu marca se vea igual de bien en pantalla y en la calle.', 'From the menu to the flyer, we build pieces with one voice so your brand looks just as good on screen and on the street.', '메뉴부터 전단지까지 하나의 목소리로 제작해 화면과 거리 어디서든 브랜드가 돋보이게 합니다.'],
        ['services.campaigns', 'Campañas', 'Campaigns', '캠페인'],
        ['services.flyers', 'Flyers', 'Flyers', '전단지'],
        ['services.materials', 'Materiales', 'Materials', '홍보물'],
        ['services.webExperience', 'Web / Experiencia digital', 'Web / Digital experience', '웹 / 디지털 경험'],
        ['services.websiteToast', 'Tu sitio también', 'Your site also', '당신의 사이트도'],
        ['services.brindes', 'brinda contigo.', 'raises a glass with you.', '함께 건배합니다.'],
        ['services.webCopy', 'Webs rápidas, claras y con carácter. Una experiencia que convierte visitas en ganas de quedarse.', 'Fast, clear websites with character. An experience that turns visits into reasons to stay.', '빠르고 명확하며 개성 있는 웹사이트. 방문을 머물고 싶은 경험으로 바꿉니다.'],
        ['services.landing', 'Landing pages', 'Landing pages', '랜딩 페이지'],
        ['services.ecommerce', 'E-commerce', 'E-commerce', '이커머스'],
        ['services.responsive', 'Responsive', 'Responsive', '반응형'],
        ['services.contentCommunity', 'Contenido / Comunidad', 'Content / Community', '콘텐츠 / 커뮤니티'],
        ['services.seeBuild', 'Que la gente vea lo que', 'Let people see what you are', '사람들이 당신이'],
        ['services.building', 'estás construyendo.', 'building.', '만드는 것을 보게.'],
        ['services.contentCopy', 'Contenido con dirección, campañas con intención y una narrativa que hace que tu comunidad quiera volver.', 'Directed content, intentional campaigns and a narrative that makes your community want to come back.', '방향성 있는 콘텐츠, 목적 있는 캠페인, 커뮤니티가 다시 찾고 싶어지는 이야기.'],
        ['services.social', 'Social media', 'Social media', '소셜 미디어'],
        ['services.analytics', 'Analítica', 'Analytics', '분석'],
        ['services.categories', 'Categorías de servicio', 'Service categories', '서비스 카테고리'],
        ['services.pause', 'Pausar', 'Pause', '일시정지'],
        ['services.resume', 'Reanudar', 'Resume', '재생'],
        ['services.hint', 'Desliza, usa las flechas o deja que la idea avance sola.', 'Swipe, use the arrows or let the idea move on its own.', '밀거나 화살표를 사용하거나 아이디어가 스스로 흐르게 두세요.'],
        ['services.menu', 'El menú creativo', 'The creative menu', '크리에이티브 메뉴'],
        ['services.identityOut', 'Una identidad con', 'An identity with', '밖으로 나가고 싶은'],
        ['services.wantsOut', 'ganas de salir.', 'somewhere to go.', '아이덴티티.'],
        ['services.offerIntro', 'Elige una pieza o armamos el ecosistema completo. Todo parte de entender qué hace especial a tu proyecto.', 'Choose one piece or let us build the complete ecosystem. It all starts with understanding what makes your project special.', '한 가지 작업부터 전체 생태계까지 선택하세요. 모든 것은 프로젝트의 특별함을 이해하는 데서 시작합니다.'],
        ['services.brandPackaging', 'Marca & packaging', 'Brand & packaging', '브랜드 & 패키징'],
        ['services.firstImpression', 'La primera impresión también se puede volver ritual.', 'A first impression can become a ritual too.', '첫인상도 하나의 의식이 될 수 있습니다.'],
        ['services.visualIdentity', 'Identidad visual', 'Visual identity', '비주얼 아이덴티티'],
        ['services.logoSystem', 'Logotipo y sistema gráfico', 'Logo and graphic system', '로고 및 그래픽 시스템'],
        ['services.labels', 'Etiquetas y empaque', 'Labels and packaging', '라벨 및 패키징'],
        ['services.guide', 'Guía de uso', 'Style guide', '사용 가이드'],
        ['services.webEcommerce', 'Web & e-commerce', 'Web & e-commerce', '웹 & 이커머스'],
        ['services.digitalHome', 'Tu casa digital, con buen diseño y sin laberintos.', 'Your digital home, with good design and no mazes.', '좋은 디자인과 명확한 구조를 갖춘 디지털 공간.'],
        ['services.onlineStores', 'Tiendas en línea', 'Online stores', '온라인 스토어'],
        ['services.seo', 'SEO esencial', 'Essential SEO', '기본 SEO'],
        ['services.contentCampaigns', 'Contenido & campañas', 'Content & campaigns', '콘텐츠 & 캠페인'],
        ['services.feed', 'Ideas que no solo llenan el feed: mueven algo.', 'Ideas that do more than fill the feed: they move something.', '피드만 채우는 것이 아니라 움직임을 만드는 아이디어.'],
        ['services.launch', 'Campañas de lanzamiento', 'Launch campaigns', '런칭 캠페인'],
        ['services.measure', 'Medición y ajustes', 'Measurement and iteration', '측정 및 개선'],
        ['services.process', 'Nuestro proceso', 'Our process', '우리의 과정'],
        ['services.listen', 'Escuchamos', 'We listen', '듣습니다'],
        ['services.listenCopy', 'Qué quieres decir y por qué importa.', 'What you want to say and why it matters.', '무엇을 말하고 싶은지, 왜 중요한지.'],
        ['services.design', 'Diseñamos', 'We design', '디자인합니다'],
        ['services.designCopy', 'Una dirección visual que se sienta tuya.', 'A visual direction that feels like you.', '당신다운 비주얼 방향을.'],
        ['services.launchProcess', 'Lanzamos', 'We launch', '출시합니다'],
        ['services.launchCopy', 'Lo ponemos allá afuera y vemos qué pasa.', 'We put it out there and see what happens.', '세상에 선보이고 반응을 봅니다.'],
        ['services.nextRound', 'Siguiente ronda', 'Next round', '다음 라운드'],
        ['services.whatIdea', '¿Qué hacemos con', 'What do we do with', '당신의 아이디어로'],
        ['services.yourIdea', 'tu idea?', 'your idea?', '무엇을 할까요?'],
        ['services.ctaCopy', 'Cuéntanos qué tienes entre manos. Si hace sentido, lo convertimos en algo que la gente quiera ver, usar y compartir.', 'Tell us what you have in mind. If it makes sense, we will turn it into something people want to see, use and share.', '무엇을 구상하고 있는지 알려 주세요. 의미가 있다면 사람들이 보고, 쓰고, 공유하고 싶은 것으로 만듭니다.'],
        ['services.talk', 'Hablemos de tu proyecto', 'Let us talk about your project', '프로젝트를 이야기해요'],
        ['services.carousel', 'carrusel', 'carousel', '캐러셀'],
        ['services.showcaseAria', 'Showcase de servicios', 'Services showcase', '서비스 쇼케이스'],
        ['services.previous', 'Servicio anterior', 'Previous service', '이전 서비스'],
        ['services.next', 'Servicio siguiente', 'Next service', '다음 서비스'],
        ['services.processAria', 'Nuestro proceso', 'Our process', '우리의 과정'],
        ['services.bottleAlt', 'Botella de Queens Hidro con etiqueta visible', 'Queens Hidro bottle with visible label', '라벨이 보이는 Queens Hidro 병'],
        ['services.eventAlt', 'Presentación de productos de Queens Hidro en un evento', 'Queens Hidro products presented at an event', '이벤트에서 선보이는 Queens Hidro 제품'],
        ['services.communityAlt', 'Comunidad disfrutando un evento de Queens Hidro', 'Community enjoying a Queens Hidro event', 'Queens Hidro 이벤트를 즐기는 커뮤니티'],
        ['services.browserMead', 'HIDROMIEL ARTESANAL', 'CRAFT MEAD', '수제 미드'],
        ['services.browserBottle', 'Una botella.', 'One bottle.', '한 병.'],
        ['services.browserStories', 'Mil historias.', 'A thousand stories.', '수많은 이야기.'],
        ['services.browserCopy', 'Experiencias digitales con personalidad, ritmo y cero plantillas aburridas.', 'Digital experiences with personality, rhythm and zero boring templates.', '개성과 리듬이 있고 지루한 템플릿은 없는 디지털 경험.'],
        ['services.explore', 'explorar', 'explore', '둘러보기'],
        ['services.original', 'ORIGINAL', 'ORIGINAL', '오리지널'],
        ['services.serviceAction', 'Quiero este servicio', 'I want this service', '이 서비스를 원합니다'],
        ['services.labelsTab', 'Etiquetas', 'Labels', '라벨'],
        ['services.webCommerce', 'Web & e-commerce', 'Web & e-commerce', '웹 & 이커머스'],
        ['services.responsiveExperience', 'Experiencia responsive', 'Responsive experience', '반응형 경험'],
        ['services.fullOption', 'La opción completa', 'The complete option', '전체 패키지'],
        ['services.onePiece', 'Tu marca no tiene que elegir una sola pieza.', 'Your brand does not have to choose just one piece.', '브랜드는 하나만 선택할 필요가 없습니다.'],
        ['services.ecosystemCopy', 'Combina identidad, web y contenido para salir con una dirección clara desde el primer día.', 'Combine identity, web and content to leave with a clear direction from day one.', '아이덴티티, 웹, 콘텐츠를 결합해 첫날부터 명확한 방향을 만들어 보세요.'],
        ['services.buildEcosystem', 'Armar mi ecosistema', 'Build my ecosystem', '나의 생태계 만들기'],

        ['faq.doubts', '¿Dudas?', 'Questions?', '궁금한 점이 있나요?'],
        ['faq.title', 'Preguntas Frecuentes', 'Frequently Asked Questions', '자주 묻는 질문'],
        ['faq.sub', 'Todas las respuestas sobre Queens Hidro. Rápido y sin vueltas.', 'All the answers about Queens Hidro. Quick and straightforward.', 'Queens Hidro에 대한 모든 답변을 빠르고 명확하게 확인하세요.'],
        ['faq.aboutMead', 'Sobre el Hidromiel', 'About mead', '미드에 대해'],
        ['faq.taste', '¿A qué sabe el hidromiel?', 'What does mead taste like?', '미드는 어떤 맛인가요?'],
        ['faq.tasteAnswer', 'A fruta fresca con miel de fondo. Fresa, zarzamora, manzana, mango: lo que dice la etiqueta es lo que saborea tu boca.', 'Fresh fruit with honey in the background. Strawberry, blackberry, apple, mango: what the label says is what you taste.', '신선한 과일에 은은한 꿀맛이 더해집니다. 딸기, 블랙베리, 사과, 망고 등 라벨에 적힌 맛을 그대로 느낄 수 있습니다.'],
        ['faq.beerWine', '¿El hidromiel es cerveza o vino?', 'Is mead beer or wine?', '미드는 맥주인가요, 와인인가요?'],
        ['faq.beerWineAnswer', 'Ninguno de los dos: es su propia categoría. Cerveza = granos, vino = uvas, hidromiel = miel. La bebida fermentada más antigua de la historia.', 'Neither: it is its own category. Beer is made from grains, wine from grapes, and mead from honey. It is the oldest fermented drink in history.', '둘 다 아닙니다. 미드는 독립적인 종류의 술입니다. 맥주는 곡물, 와인은 포도, 미드는 꿀로 만듭니다. 역사상 가장 오래된 발효 음료입니다.'],
        ['faq.alcohol', '¿Cuánto alcohol tiene?', 'How much alcohol does it contain?', '알코올 도수는 얼마인가요?'],
        ['faq.alcoholAnswer', 'Entre 5% y 12%, según la edición. Cada botella dice su porcentaje exacto.', 'Between 5% and 12%, depending on the edition. Each bottle shows its exact percentage.', '에디션에 따라 5%에서 12%입니다. 정확한 도수는 각 병에 표시되어 있습니다.'],
        ['faq.shopping', 'Compras y Membresía', 'Shopping and membership', '구매 및 멤버십'],
        ['faq.howBuy', '¿Cómo compro Queens Hidro?', 'How can I buy Queens Hidro?', 'Queens Hidro를 어떻게 구매하나요?'],
        ['faq.howBuyAnswer', 'En festivales, tiendas selectas y con nuestros distribuidores en toda la República. Síguenos en Instagram @queenshidro para saber dónde estaremos.', 'At festivals, select shops and through our distributors across Mexico. Follow us on Instagram @queenshidro to find out where we will be.', '페스티벌, 엄선된 매장, 멕시코 전역의 유통처에서 구매할 수 있습니다. 어디에서 만날 수 있는지 Instagram @queenshidro를 팔로우하세요.'],
        ['faq.benefits', '¿Qué beneficios tiene la membresía?', 'What are the membership benefits?', '멤버십 혜택은 무엇인가요?'],
        ['faq.benefitsAnswer', 'Ediciones limitadas, descuentos en festivales, catas privadas y contenido exclusivo. Es gratis: regístrate con tu correo.', 'Limited editions, festival discounts, private tastings and exclusive content. It is free: sign up with your email.', '한정 에디션, 페스티벌 할인, 프라이빗 시음, 독점 콘텐츠를 제공합니다. 무료이니 이메일로 가입하세요.'],
        ['faq.shipping', '¿Hacen envíos a todo México?', 'Do you ship throughout Mexico?', '멕시코 전역으로 배송하나요?'],
        ['faq.shippingAnswer', 'Sí, a toda la República. Para negocios hay precios por volumen y para consumidores te decimos dónde conseguirla.', 'Yes, throughout Mexico. Businesses can ask about volume pricing, and consumers can contact us to find a nearby place to buy.', '네, 멕시코 전역으로 배송합니다. 사업자는 대량 구매 가격을 문의할 수 있고, 소비자는 가까운 판매처를 안내받을 수 있습니다.'],
        ['faq.businessPrefix', 'Sí, a toda la República. ¿Eres negocio? Mira', 'Yes, throughout Mexico. Are you a business? See', '네, 멕시코 전역입니다. 사업자이신가요? 다음을 확인하세요:'],
        ['faq.businessSuffix', 'para precios por volumen. ¿Consumidor? Escríbenos y te decimos dónde conseguirla.', 'for volume pricing. A consumer? Contact us and we will tell you where to find it.', '대량 구매 가격을 확인하세요. 소비자라면 문의해 주시면 판매처를 안내해 드립니다.'],
        ['faq.distribute', '¿Puedo distribuir Queens Hidro en mi negocio?', 'Can I distribute Queens Hidro at my business?', '매장에서 Queens Hidro를 유통할 수 있나요?'],
        ['faq.distributeAnswer', 'Claro. Bar, restaurante, tienda o festival: entra a la sección Distribuye Queens y te contamos cómo empezar.', 'Of course. Bar, restaurant, shop or festival: visit Distribute Queens and we will tell you how to get started.', '물론입니다. 바, 레스토랑, 매장, 페스티벌 어디서든 가능합니다. Queens 유통 페이지에서 시작 방법을 확인하세요.'],
        ['faq.distributePrefix', 'Claro. Bar, restaurante, tienda o festival: entra a', 'Of course. Bar, restaurant, shop or festival: visit', '물론입니다. 바, 레스토랑, 매장, 페스티벌 어디서든 가능합니다. 다음을 방문하세요:'],
        ['faq.distributeSuffix', 'y te contamos cómo empezar.', 'and we will tell you how to get started.', '시작 방법을 안내해 드립니다.'],
        ['faq.production', 'Producción e Ingredientes', 'Production and ingredients', '생산 및 원료'],
        ['faq.honey', '¿De dónde viene la miel que usan?', 'Where does your honey come from?', '꿀은 어디에서 오나요?'],
        ['faq.honeyAnswer', 'Directo de apicultores de Nuevo León. Cada compra apoya a las familias que cuidan las colmenas y mantienen vivas a las abejas de nuestra tierra.', 'Directly from beekeepers in Nuevo León. Every purchase supports the families who care for the hives and keep the bees of our land alive.', '누에보레온의 양봉가에게서 직접 공급받습니다. 구매할 때마다 벌통을 돌보고 이 땅의 꿀벌을 지키는 가족을 응원합니다.'],
        ['faq.vegan', '¿El hidromiel es vegano?', 'Is mead vegan?', '미드는 비건인가요?'],
        ['faq.veganAnswer', 'No, porque se hace con miel (las abejas son las reinas del proceso). El resto es fruta, agua y levadura.', 'No, because it is made with honey (the bees are the queens of the process). The rest is fruit, water and yeast.', '아니요. 꿀로 만들기 때문입니다. (꿀벌이 이 과정의 여왕입니다.) 나머지는 과일, 물, 효모입니다.'],
        ['faq.gluten', '¿Tiene gluten?', 'Does it contain gluten?', '글루텐이 있나요?'],
        ['faq.glutenAnswer', 'No. Solo miel, agua y levadura. Libre de gluten por naturaleza, buena alternativa a la cerveza.', 'No. Only honey, water and yeast. Naturally gluten-free and a great alternative to beer.', '아니요. 꿀, 물, 효모만 사용합니다. 자연적으로 글루텐이 없어 맥주의 좋은 대안입니다.'],
        ['faq.serve', '¿Cómo se debe servir y conservar?', 'How should it be served and stored?', '어떻게 마시고 보관해야 하나요?'],
        ['faq.serveAnswer', 'Frío, entre 6 y 10 grados, en copa de vino o vaso bajo. Abierta, aguanta 5-7 días en el refri. Sin abrir, hasta 2 años.', 'Serve cold, between 6 and 10 degrees, in a wine glass or low tumbler. Once opened, it keeps for 5-7 days in the fridge. Unopened, it lasts up to 2 years.', '6~10도로 차갑게 와인 잔이나 낮은 잔에 따라 마세요. 개봉 후 냉장 보관하면 5~7일, 미개봉 상태로는 최대 2년 보관할 수 있습니다.'],
        ['faq.notFound', '¿No encontraste lo que buscabas?', 'Did not find what you were looking for?', '원하는 답을 찾지 못했나요?'],
        ['faq.contact', 'Contáctanos', 'Contact us', '문의하기'],
        ['faq.live', 'Vive la experiencia', 'Live the experience', '경험해 보세요'],

        ['login.title', 'Ingresar', 'Log in', '로그인'],

        ['account.tag', 'Mi Cuenta', 'My Account', '내 계정'],
        ['account.profile', 'Tu perfil', 'Your profile', '내 프로필'],
        ['account.sub', 'Tu perfil, tu suscripción, tu experiencia.', 'Your profile, your membership, your experience.', '프로필, 멤버십, 그리고 나의 경험.'],
        ['account.loadingSub', 'Cargando suscripción...', 'Loading membership...', '멤버십을 불러오는 중...'],
        ['account.loading', 'Cargando...', 'Loading...', '불러오는 중...'],
        ['account.memberSince', 'Miembro desde', 'Member since', '가입일'],
        ['account.verified', 'Email verificado', 'Email verified', '이메일 인증'],
        ['account.lastAccess', 'Último acceso', 'Last sign-in', '최근 로그인'],
        ['account.home', 'Ir al inicio', 'Go home', '홈으로'],
        ['account.membership', 'Membresía', 'Membership', '멤버십'],
        ['account.noSub', 'No tienes una suscripción activa.', 'You do not have an active membership.', '활성 멤버십이 없습니다.'],
        ['account.viewSubs', 'Ver suscripciones', 'View memberships', '멤버십 보기'],
        ['account.yourSub', 'Tu suscripción', 'Your membership', '내 멤버십'],
        ['account.status', 'Estado', 'Status', '상태'],
        ['account.mode', 'Modalidad', 'Billing mode', '결제 방식'],
        ['account.duration', 'Duración', 'Duration', '기간'],
        ['account.monthlyCharge', 'Cargo mensual', 'Monthly charge', '월간 결제'],
        ['account.totalPaid', 'Total pagado', 'Total paid', '총 결제액'],
        ['account.savings', 'Ahorro', 'Savings', '절약'],
        ['account.delivery', 'Entrega en', 'Delivery to', '배송지'],
        ['account.address', 'Dirección', 'Address', '주소'],
        ['account.nextCharge', 'Siguiente cargo', 'Next charge', '다음 결제'],
        ['account.commitment', 'Compromiso hasta', 'Commitment through', '약정 종료일'],
        ['account.phone', 'Teléfono', 'Phone', '전화번호'],
        ['account.cancel', 'Cancelar suscripción', 'Cancel membership', '멤버십 취소'],
        ['account.active', 'active', 'Active', '활성'],
        ['account.pending', 'pending', 'Pending', '대기 중'],
        ['account.recurringBadge', 'MENSUAL · RENOVABLE', 'MONTHLY · RENEWABLE', '월간 · 자동 갱신'],
        ['account.prepaidBadge', 'PREPAGO', 'PREPAID', '선불'],
        ['account.vsRegular', 'vs sin suscripción', 'vs no membership', '멤버십 미가입 대비'],
        ['account.cancelConfirm', '¿Cancelar tu suscripción? Se cancelará y no se harán más cobros.', 'Cancel your membership? It will be cancelled and no further charges will be made.', '멤버십을 취소할까요? 취소하면 더 이상 결제되지 않습니다.'],

        ['cart.title', 'Tu Carrito', 'Your Cart', '장바구니'],
        ['cart.empty', 'Tu carrito está vacío. Explora nuestros hidromieles.', 'Your cart is empty. Explore our meads.', '장바구니가 비어 있습니다. 미드를 둘러보세요.'],
        ['cart.recover', '¿Agregaste algo antes?', 'Added something before?', '전에 담은 상품이 있나요?'],
        ['cart.signInRecover', 'Inicia sesión', 'Log in', '로그인'],
        ['cart.recoverEnd', 'para recuperar tu carrito.', 'to recover your cart.', '하여 장바구니를 복원하세요.'],
        ['cart.goShop', 'Ir a la tienda', 'Go to shop', '쇼핑몰로 이동'],
        ['cart.product', 'producto', 'product', '상품'],
        ['cart.products', 'productos', 'products', '상품'],
        ['cart.order', 'Tu pedido', 'Your order', '주문 내역'],
        ['cart.clear', 'Vaciar', 'Clear', '비우기'],
        ['cart.subscriber', 'Suscriptor', 'Member', '회원'],
        ['cart.subscriptionCta', 'Con suscripción pagas', 'With a membership you pay', '멤버십 회원은'],
        ['cart.shippingInstead', 'de envío en vez de', 'shipping instead of', '배송비만 내고, 원래'],
        ['cart.viewPlans', 'Ver planes', 'View plans', '플랜 보기'],
        ['cart.estimated', 'Entrega estimada:', 'Estimated delivery:', '예상 배송:'],
        ['cart.summary', 'Resumen del pedido', 'Order summary', '주문 요약'],
        ['cart.subtotal', 'Subtotal', 'Subtotal', '소계'],
        ['cart.payCard', 'Tarjeta de crédito / débito', 'Credit / debit card', '신용 / 체크카드'],
        ['cart.payCardSub', 'Pago seguro vía Mercado Pago', 'Secure payment via Mercado Pago', 'Mercado Pago를 통한 안전한 결제'],
        ['cart.payTransfer', 'Transferencia bancaria', 'Bank transfer', '계좌이체'],
        ['cart.payTransferSub', 'Depósito directo a nuestra cuenta', 'Direct deposit to our account', '저희 계좌로 직접 입금'],
        ['cart.useSaved', 'Usar mis datos guardados', 'Use my saved details', '저장된 정보 사용'],
        ['cart.emailRequired', 'Correo electrónico *', 'Email *', '이메일 *'],
        ['cart.emailError', 'Escribe un correo válido para enviarte la confirmación de tu pedido', 'Enter a valid email so we can send your order confirmation', '주문 확인을 받을 수 있는 유효한 이메일을 입력하세요'],
        ['cart.nameRequired', 'Nombre completo *', 'Full name *', '성명 *'],
        ['cart.namePlaceholder', 'Tu nombre', 'Your name', '이름'],
        ['cart.nameError', 'Escribe tu nombre para el envío', 'Enter your name for shipping', '배송을 위해 이름을 입력하세요'],
        ['cart.phoneRequired', 'Teléfono *', 'Phone *', '전화번호 *'],
        ['cart.phonePlaceholder', '10 dígitos', '10 digits', '10자리'],
        ['cart.phoneError', 'El teléfono debe tener 10 dígitos. Solo lo usamos para coordinar tu entrega.', 'Your phone must have 10 digits. We only use it to coordinate delivery.', '전화번호는 10자리여야 합니다. 배송 조율에만 사용합니다.'],
        ['cart.streetRequired', 'Calle y número *', 'Street and number *', '도로명 및 번지 *'],
        ['cart.streetPlaceholder', 'Av. Siempre Viva 742', 'Street and number', '도로명 및 번지'],
        ['cart.streetError', 'Escribe la calle y número', 'Enter the street and number', '도로명과 번지를 입력하세요'],
        ['cart.colony', 'Colonia', 'Neighborhood', '지역'],
        ['cart.cityRequired', 'Ciudad / Municipio *', 'City / Municipality *', '도시 / 시·군 *'],
        ['cart.cityPlaceholder', 'Monterrey', 'City', '도시'],
        ['cart.cityError', 'Escribe tu ciudad o municipio', 'Enter your city or municipality', '도시 또는 시·군을 입력하세요'],
        ['cart.state', 'Estado', 'State', '주/도'],
        ['cart.zip', 'Código postal', 'Postal code', '우편번호'],
        ['cart.zipError', 'El código postal debe tener 5 dígitos', 'The postal code must have 5 digits', '우편번호는 5자리여야 합니다'],
        ['cart.notes', 'Notas (opcional)', 'Notes (optional)', '메모 (선택 사항)'],
        ['cart.notesPlaceholder', 'Referencias, edificio...', 'References, building...', '참고 사항, 건물명...'],
        ['cart.age', 'Confirmo que soy', 'I confirm that I am', '나는'],
        ['cart.adult', 'mayor de 18 años', 'over 18 years old', '18세 이상'],
        ['cart.ageEnd', 'Prohibida la venta de alcohol a menores.', 'Alcohol sales to minors are prohibited.', '미성년자에게 주류를 판매할 수 없습니다.'],
        ['cart.placeOrder', 'Realizar pedido y pagar', 'Place order and pay', '주문하고 결제하기'],
        ['cart.transferNote', 'Transferencia directa: confirma tu pedido y envíanos tu comprobante.', 'Direct transfer: confirm your order and send us your payment receipt.', '계좌이체: 주문을 확인하고 입금 확인증을 보내 주세요.'],
        ['cart.confirmTransfer', 'Confirmar pedido por transferencia', 'Confirm order by bank transfer', '계좌이체로 주문 확인'],
        ['cart.cardNote', 'Pago seguro vía Mercado Pago. Puedes pagar con tarjeta.', 'Secure payment via Mercado Pago. You can pay by card.', 'Mercado Pago를 통한 안전한 결제. 카드로 결제할 수 있습니다.'],
        ['cart.methods', 'Métodos de pago', 'Payment methods', '결제 방법'],
        ['cart.trustNote', '+18 · Hidromiel artesanal · Monterrey, NL', '+18 · Craft mead · Monterrey, NL', '+18 · 수제 미드 · 몬테레이, NL'],
        ['cart.undo', 'Deshacer', 'Undo', '실행 취소'],
        ['cart.removed', 'Producto eliminado', 'Product removed', '상품이 삭제되었습니다'],
        ['cart.clearConfirm', '¿Vaciar todo tu carrito?', 'Clear your entire cart?', '장바구니를 모두 비울까요?'],
        ['cart.reviewFields', 'Revisa los campos marcados', 'Review the marked fields', '표시된 항목을 확인하세요'],
        ['cart.creatingOrder', 'Creando tu pedido...', 'Creating your order...', '주문 생성 중...'],
        ['cart.retry', 'Reintentar pago', 'Try payment again', '결제 다시 시도'],
        ['cart.paymentConfirmed', '¡Pago confirmado!', 'Payment confirmed!', '결제가 확인되었습니다!'],
        ['cart.orderConfirmed', 'Tu orden', 'Your order', '주문'],
        ['cart.paidCorrectly', 'fue pagada correctamente. Te contactaremos pronto para coordinar la entrega.', 'was paid successfully. We will contact you soon to coordinate delivery.', '이 성공적으로 결제되었습니다. 배송 조율을 위해 곧 연락드리겠습니다.'],
        ['cart.paymentPending', 'Pago pendiente', 'Payment pending', '결제 대기 중'],
        ['cart.confirmingPayment', 'Estamos confirmando tu pago.', 'We are confirming your payment.', '결제를 확인하고 있습니다.'],
        ['cart.orderRegistered', 'quedó registrada. La confirmación puede tardar unos minutos.', 'has been registered. Confirmation may take a few minutes.', '등록되었습니다. 확인까지 몇 분 걸릴 수 있습니다.'],
        ['cart.saveOrder', 'Guarda tu número de orden:', 'Save your order number:', '주문 번호를 저장하세요:'],
        ['cart.paymentThirty', 'Si tu pago no se confirma en 30 min, escríbenos con tu número de orden', 'If your payment is not confirmed within 30 minutes, contact us with your order number', '30분 내 결제가 확인되지 않으면 주문 번호와 함께 문의해 주세요'],
        ['cart.responsible', 'Consume con responsabilidad, +18', 'Drink responsibly, +18', '책임감 있게 즐겨 주세요, +18'],
        ['cart.orders', 'Mis pedidos', 'My orders', '내 주문'],
        ['cart.paymentNotComplete', 'Pago no completado', 'Payment not completed', '결제가 완료되지 않았습니다'],
        ['cart.notCharged', 'No se te cobró nada. Tu carrito está intacto y puedes intentarlo de nuevo cuando quieras.', 'You were not charged. Your cart is intact and you can try again whenever you like.', '청구된 금액이 없습니다. 장바구니는 그대로이며 언제든 다시 시도할 수 있습니다.'],
        ['cart.orderTransfer', 'Pedido registrado', 'Order registered', '주문이 등록되었습니다'],
        ['cart.transferRegistered', 'quedó registrada con pago por transferencia.', 'has been registered with bank transfer payment.', '계좌이체 결제로 등록되었습니다.'],
        ['cart.totalTransfer', 'Total a transferir:', 'Total to transfer:', '이체할 금액:'],
        ['cart.bank', 'Banco:', 'Bank:', '은행:'],
        ['cart.holder', 'Titular:', 'Account holder:', '예금주:'],
        ['cart.clabe', 'CLABE:', 'CLABE:', 'CLABE:'],
        ['cart.account', 'Cuenta:', 'Account:', '계좌:'],
        ['cart.sendReceipt', 'Envía tu comprobante por Instagram (@queenshidro) o WhatsApp y te confirmamos el pedido.', 'Send your receipt through Instagram (@queenshidro) or WhatsApp and we will confirm your order.', 'Instagram(@queenshidro) 또는 WhatsApp으로 입금 확인증을 보내 주시면 주문을 확인해 드립니다.'],
        ['cart.transferNotConfigured', 'La información de transferencia aún no está configurada. Contáctanos por Instagram.', 'Transfer information is not configured yet. Contact us on Instagram.', '계좌이체 정보가 아직 설정되지 않았습니다. Instagram으로 문의해 주세요.'],
        ['cart.bankLabel', 'Banco', 'Bank', '은행'],
        ['cart.holderLabel', 'Titular', 'Account holder', '예금주'],
        ['cart.accountLabel', 'Cuenta', 'Account', '계좌'],
        ['cart.orderCreateError', 'No se pudo crear el pedido', 'The order could not be created', '주문을 생성하지 못했습니다'],

        ['legal.document', 'Documento legal', 'Legal document', '법적 문서'],
        ['legal.lastUpdated', 'Última actualización: agosto de 2026', 'Last updated: August 2026', '최종 업데이트: 2026년 8월'],
        ['legal.terms', 'Términos y Condiciones', 'Terms and Conditions', '이용약관'],
        ['legal.termsSub', 'Las reglas claras de Queens Hidro: tu compra, tu membresía y tu experiencia en este sitio.', 'The clear rules of Queens Hidro: your purchase, membership and experience on this site.', 'Queens Hidro의 명확한 규칙: 구매, 멤버십, 사이트 이용에 관한 안내입니다.'],
        ['legal.shippingTag', 'Envíos', 'Shipping', '배송'],
        ['legal.shipping', 'Políticas de Envío', 'Shipping Policy', '배송 정책'],
        ['legal.shippingSub', 'Cómo llegan nuestras botellas a tu puerta, en cuánto tiempo y qué hacemos si algo sale mal en el camino.', 'How our bottles reach your door, how long it takes and what we do if something goes wrong along the way.', '병이 집까지 도착하는 과정과 시간, 배송 중 문제가 생겼을 때의 안내입니다.'],
        ['legal.privacyTag', 'Tus datos, claros', 'Your data, clearly', '개인정보 안내'],
        ['legal.privacy', 'Aviso de Privacidad', 'Privacy Notice', '개인정보 처리방침'],
        ['legal.privacySub', 'Te contamos qué información usamos para preparar tu pedido y cómo puedes ejercer tus derechos.', 'We explain what information we use to prepare your order and how you can exercise your rights.', '주문 준비에 사용하는 정보와 권리를 행사하는 방법을 안내합니다.'],
        ['legal.returnsTag', 'Compra con confianza', 'Shop with confidence', '안심하고 구매하세요'],
        ['legal.returns', 'Devoluciones', 'Returns', '반품'],
        ['legal.returnsSub', 'Por el tipo de producto no aceptamos devoluciones ordinarias. Si algo llegó dañado, queremos saberlo y revisarlo contigo.', 'Because of the type of product, we do not accept ordinary returns. If something arrived damaged, tell us so we can review it with you.', '제품 특성상 일반적인 반품은 받지 않습니다. 상품이 손상되어 도착했다면 알려 주시면 함께 확인하겠습니다.'],
        ['legal.ready', '¿Lista para probar el hidromiel?', 'Ready to try mead?', '미드를 맛볼 준비가 되었나요?'],
        ['legal.learnMore', 'Conoce más sobre Queens Hidro', 'Learn more about Queens Hidro', 'Queens Hidro 더 알아보기'],
        ['legal.goShop', 'Ir a la tienda', 'Go to shop', '쇼핑몰로 이동'],
        ['legal.meetUs', 'Conócenos', 'Meet us', '우리를 만나 보세요'],
        ['legal.terms1', '1. Aceptación de los términos', '1. Acceptance of the terms', '1. 약관 동의'],
        ['legal.terms2', '2. Producto y consumo responsable', '2. Product and responsible consumption', '2. 제품 및 책임 있는 음주'],
        ['legal.terms3', '3. Compras y precios', '3. Purchases and prices', '3. 구매 및 가격'],
        ['legal.terms4', '4. Pagos', '4. Payments', '4. 결제'],
        ['legal.terms5', '5. Envíos y entrega', '5. Shipping and delivery', '5. 배송 및 수령'],
        ['legal.terms6', '6. Membresía', '6. Membership', '6. 멤버십'],
        ['legal.terms7', '7. Propiedad intelectual', '7. Intellectual property', '7. 지식재산권'],
        ['legal.terms8', '8. Limitación de responsabilidad', '8. Limitation of liability', '8. 책임의 제한'],
        ['legal.terms9', '9. Legislación aplicable', '9. Applicable law', '9. 준거법'],
        ['legal.terms10', '10. Contacto', '10. Contact', '10. 문의'],
        ['legal.shipping1', '1. Cobertura', '1. Coverage', '1. 배송 범위'],
        ['legal.shipping2', '2. Preparación', '2. Preparation', '2. 준비'],
        ['legal.shipping3', '3. Tiempos de entrega', '3. Delivery times', '3. 배송 기간'],
        ['legal.shipping4', '4. Costo', '4. Cost', '4. 비용'],
        ['legal.shipping5', '5. Empaque de botellas', '5. Bottle packaging', '5. 병 포장'],
        ['legal.shipping6', '6. Entrega fallida o dirección incorrecta', '6. Failed delivery or incorrect address', '6. 배송 실패 또는 잘못된 주소'],
        ['legal.shipping7', '7. Contacto', '7. Contact', '7. 문의'],
        ['legal.privacy1', '1. Responsable', '1. Data controller', '1. 개인정보 처리 책임자'],
        ['legal.privacy2', '2. Datos que podemos recabar', '2. Data we may collect', '2. 수집할 수 있는 정보'],
        ['legal.privacy3', '3. Finalidades primarias', '3. Primary purposes', '3. 주요 이용 목적'],
        ['legal.privacy4', '4. Finalidades secundarias', '4. Secondary purposes', '4. 부수적 이용 목적'],
        ['legal.privacy5', '5. Transferencias y proveedores', '5. Transfers and providers', '5. 정보 제공 및 서비스 제공자'],
        ['legal.privacy6', '6. Derechos ARCO y revocación', '6. ARCO rights and withdrawal', '6. ARCO 권리 및 동의 철회'],
        ['legal.privacy7', '7. Cookies y tecnologías similares', '7. Cookies and similar technologies', '7. 쿠키 및 유사 기술'],
        ['legal.privacy8', '8. Menores de edad', '8. Minors', '8. 미성년자'],
        ['legal.privacy9', '9. Cambios al aviso', '9. Changes to this notice', '9. 방침 변경'],
        ['legal.privacy10', '10. Contacto', '10. Contact', '10. 문의'],
        ['legal.returns1', '1. Producto dañado o quebrado', '1. Damaged or broken product', '1. 손상되거나 깨진 제품'],
        ['legal.returns2', '2. Qué necesitamos para revisarlo', '2. What we need to review it', '2. 확인을 위해 필요한 정보'],
        ['legal.returns3', '3. Evaluación y posible reemplazo', '3. Review and possible replacement', '3. 검토 및 교환 가능 여부'],
        ['legal.returns4', '4. Pedido incorrecto o piezas faltantes', '4. Incorrect order or missing items', '4. 잘못된 주문 또는 누락된 상품'],
        ['legal.returns5', '5. Contacto', '5. Contact', '5. 문의'],
        ['legal.noReturns', 'No hay devoluciones ordinarias', 'No ordinary returns', '일반적인 반품 불가'],
        ['legal.damagedQuestion', '¿Tu pedido llegó dañado o quebrado?', 'Did your order arrive damaged or broken?', '주문이 손상되거나 깨져 도착했나요?'],

        ['validation.noConnection', 'No pudimos conectar el formulario. Escríbenos a hola@queenshidro.com.', 'We could not connect to the form. Email us at hola@queenshidro.com.', '양식을 연결할 수 없습니다. hola@queenshidro.com으로 문의해 주세요.'],
        ['validation.noRequest', 'No se pudo enviar la solicitud.', 'The request could not be sent.', '신청서를 전송하지 못했습니다.'],
        ['validation.chooseDate', 'Elige una fecha con al menos 7 días de anticipación.', 'Choose a date at least 7 days in advance.', '최소 7일 이후의 날짜를 선택하세요.'],
        ['validation.name', 'Escribe tu nombre.', 'Enter your name.', '이름을 입력하세요.'],
        ['validation.email', 'Escribe un correo válido.', 'Enter a valid email.', '유효한 이메일을 입력하세요.'],
        ['validation.company', 'Escribe el nombre de tu negocio.', 'Enter your business name.', '매장 이름을 입력하세요.'],
        ['validation.volume', 'Cuéntanos qué volumen te gustaría explorar.', 'Tell us what volume you would like to explore.', '희망 물량을 알려 주세요.'],
        ['validation.municipality', 'Selecciona tu municipio.', 'Select your municipality.', '지역을 선택하세요.'],
        ['validation.nationalLocation', 'Escribe tu estado y ciudad.', 'Enter your state and city.', '주/도와 도시를 입력하세요.'],
        ['validation.error', 'No se pudo enviar la solicitud.', 'The request could not be sent.', '신청서를 전송하지 못했습니다.'],
        ['common.error', 'Error', 'Error', '오류'],
        ['common.productInvalid', 'Producto inválido', 'Invalid product', '잘못된 제품'],
        ['common.maxProduct', 'Máximo {value} por producto', 'Maximum {value} per product', '제품당 최대 {value}개'],
        ['common.maxReached', 'Cantidad máxima alcanzada', 'Maximum quantity reached', '최대 수량에 도달했습니다'],
        ['common.onlyProduct', 'Solo puedes pedir {value} de este producto', 'You can only order {value} of this product', '이 제품은 {value}개만 주문할 수 있습니다'],
        ['common.availableOnly', 'Solo quedan {value} de {name}, ajustamos la cantidad', 'Only {value} of {name} remain; we adjusted the quantity', '{name}은(는) {value}개만 남아 수량을 조정했습니다'],
        ['common.unavailableRemoved', '{name} ya no está disponible y se quitó de tu carrito', '{name} is no longer available and was removed from your cart', '{name}은(는) 더 이상 판매되지 않아 장바구니에서 삭제되었습니다'],
        ['common.priceUpdated', 'El precio de {name} se actualizó ({price})', 'The price of {name} was updated ({price})', '{name}의 가격이 변경되었습니다 ({price})'],
        ['common.maxNamed', 'Máximo {value} de {name} por pedido', 'Maximum {value} of {name} per order', '주문당 {name} 최대 {value}개'],
        ['common.soldOutRemoved', '{name} se agotó y se quitó de tu carrito', '{name} sold out and was removed from your cart', '{name}이(가) 품절되어 장바구니에서 삭제되었습니다'],
        ['common.loadingError', 'Error: {message}', 'Error: {message}', '오류: {message}'],
        ['calendar.weekdays', 'L,M,M,J,V,S,D', 'M,T,W,T,F,S,S', '월,화,수,목,금,토,일'],
        ['common.slide', 'Slide {value}', 'Slide {value}', '슬라이드 {value}'],
        ['common.content', 'Ir al contenido {value}', 'Go to content {value}', '{value}번 콘텐츠로 이동'],
        ['common.months', '{value} meses', '{value} months', '{value}개월'],
        ['common.bottlesMonth', '{value} botellas/mes', '{value} bottles/month', '{value}병/월'],
        ['common.bottleOption', '{value} botellas/mes — ${price} MXN', '{value} bottles/month — ${price} MXN', '{value}병/월 — ${price} MXN'],
        ['common.discount', '{value}% desc', '{value}% off', '{value}% 할인'],
        ['common.extraDiscount', '{value}% extra por prepago', '{value}% extra with prepayment', '선불 추가 {value}%'],
        ['common.savingsBottle', 'Ahorras {value}% por botella', 'Save {value}% per bottle', '병당 {value}% 절약'],
        ['common.savingsExtra', 'Ahorras {value}% + {extra}% extra por prepago', 'Save {value}% + {extra}% extra with prepayment', '{value}% + 선불 추가 {extra}% 절약'],
        ['common.monthlyAmount', '${value} MXN/mes', '${value} MXN/month', '${value} MXN/월'],
        ['common.monthlyTimes', '${value} × {months}', '${value} × {months}', '${value} × {months}'],
        ['common.monthlyBottles', '{value} botellas/mes', '{value} bottles/month', '{value}병/월'],
        ['common.perBottleNormal', '${value} c/u (normal ${normal})', '${value} each (regular ${normal})', '${value} 개당 (일반 ${normal})'],
        ['common.shippingMonth', '$150.00/mes', '$150.00/month', '$150.00/월'],
        ['common.totalPaid', 'Total prepago', 'Prepaid total', '선불 합계'],
        ['common.errorMessage', 'Error: {message}', 'Error: {message}', '오류: {message}']
    ]);

    var CMS = {
        dist_btn: 'dist.requestVisit',
        dist_contact_sub: 'dist.contactSub',
        dist_contact_title: 'dist.contactTitle',
        dist_feat1_desc: 'dist.feat1Desc',
        dist_feat1_title: 'dist.feat1Title',
        dist_feat2_desc: 'dist.feat2Desc',
        dist_feat2_title: 'dist.feat2Title',
        dist_feat3_desc: 'dist.feat3Desc',
        dist_feat3_title: 'dist.feat3Title',
        dist_hint_barrel: 'dist.barrelHint',
        dist_hint_bottle: 'dist.bottleHint',
        dist_lead: 'dist.distributeLead',
        dist_sub: 'dist.sub',
        dist_tag: 'dist.tag',
        dist_text: 'dist.text',
        dist_title: 'dist.title',
        eventos_sub: 'events.subLive',
        faqs_cta: 'faq.live',
        faqs_membresia: 'faq.benefitsAnswer',
        faqs_miel: 'faq.honeyAnswer',
        faqs_sabor: 'faq.tasteAnswer',
        faqs_sub: 'faq.sub',
        faqs_vegano: 'faq.veganAnswer',
        footer_desc_long: 'footer.desc',
        footer_desc_short: 'footer.descShort',
        hero_cta_text: 'home.try',
        hero_kicker: 'home.kickerLocal',
        hero_sub: 'home.heroNorth',
        hero_title: 'home.heroTitleCms',
        index_tribe_sub: 'home.tribeSub',
        index_tribe_tag: 'home.outside',
        index_tribe_title: 'home.uniqueCms',
        nosotros_sub: 'about.sub',
        nosotros_text: 'about.storyText',
        nosotros_title: 'about.titleCms',
        delivery_estimate: 'cart.deliveryValue'
    };

    add('dist.distributeLead', 'Distribuye Queens Hidro', 'Distribute Queens Hidro', 'Queens Hidro 유통');
    add('home.heroTitleCms', 'Hidromiel artesanal usamos fruta REAL Miel de abeja PURA', 'Craft mead made with REAL fruit PURE bee honey', '진짜 과일로 만든 수제 미드 순수한 벌꿀');
    add('home.uniqueCms', 'Una hidromiel única, hecha para vivirla.', 'A one-of-a-kind mead, made to be lived.', '직접 경험하도록 만든 특별한 미드.');
    add('about.storyText', 'Queens Hidro es hidromiel artesanal con frutas reales —fresa, zarzamora, mango y manzana— y miel 100% mexicana. Trabajamos con los mejores apicultores de la región y cuidamos cada fermentación como ellos cuidan sus colmenas. Cada compra apoya a quienes mantienen vivas las abejas de nuestra tierra.', 'Queens Hidro is craft mead made with real fruit - strawberry, blackberry, mango and apple - and 100% Mexican honey. We work with the best beekeepers in the region and care for every fermentation as they care for their hives. Every purchase supports the people who keep the bees of our land alive.', 'Queens Hidro는 딸기, 블랙베리, 망고, 사과 같은 진짜 과일과 100% 멕시코 꿀로 만든 수제 미드입니다. 지역 최고의 양봉가들과 함께하며 그들이 벌통을 돌보듯 모든 발효를 정성껏 관리합니다. 구매할 때마다 이 땅의 꿀벌을 지키는 사람들을 응원합니다.');
    add('about.titleCms', 'De la colmena a tu fiesta', 'From the hive to your celebration', '벌통에서 당신의 축제까지');
    add('cart.deliveryValue', '2 a 5 días hábiles', '2 to 5 business days', '영업일 기준 2~5일');
    addMany([
        ['home.kickerLocal', 'Consume local · Miel mexicana · Hecho en MTY', 'Shop local · Mexican honey · Made in MTY', '로컬 소비 · 멕시코 꿀 · MTY에서 제작'],
        ['home.heroNorth', 'Miel del Norte', 'Honey from the North', '북쪽의 꿀'],
        ['events.subLive', 'Hidromiel frío, vasos listos y la banda completa.', 'Cold mead, glasses ready and the whole crew together.', '차가운 미드, 준비된 잔, 함께하는 사람들.'],
        ['payment.instructions', 'Realiza la transferencia por el total exacto y envíanos tu comprobante para confirmar tu pedido.', 'Transfer the exact total and send us your receipt to confirm your order.', '정확한 금액을 이체한 뒤 주문 확인을 위해 입금 확인증을 보내 주세요.'],
        ['legal.returnsPolicy', 'Política de Devoluciones', 'Returns Policy', '반품 정책'],
        ['home.heroCmsMead', 'Hidromiel artesanal', 'Craft mead', '수제 미드'],
        ['home.heroCmsFruit', 'usamos fruta REAL', 'made with REAL fruit', '진짜 과일로 만들었습니다'],
        ['home.heroCmsHoney', 'Miel de abeja', 'Bee honey', '벌꿀'],
        ['home.heroCmsPure', 'PURA', 'PURE', '순수한'],
        ['about.storyLead', 'Queens Hidro es hidromiel artesanal con frutas reales —fresa, zarzamora, mango y manzana— y', 'Queens Hidro is craft mead made with real fruit - strawberry, blackberry, mango and apple - and', 'Queens Hidro는 딸기, 블랙베리, 망고, 사과 같은 진짜 과일과'],
        ['about.honey100', 'miel 100% mexicana', '100% Mexican honey', '100% 멕시코 꿀'],
        ['about.storyMiddle', '. Trabajamos con los mejores apicultores de la región y cuidamos cada fermentación como ellos cuidan sus colmenas.', '. We work with the best beekeepers in the region and care for every fermentation as they care for their hives.', '. 지역 최고의 양봉가들과 함께하며 그들이 벌통을 돌보듯 모든 발효를 정성껏 관리합니다.'],
        ['about.storyEnd', 'Cada compra apoya a quienes mantienen vivas las abejas de nuestra tierra.', 'Every purchase supports the people who keep the bees of our land alive.', '구매할 때마다 이 땅의 꿀벌을 지키는 사람들을 응원합니다.'],
        ['faq.meadAnswer', 'La bebida fermentada más antigua del mundo: miel, agua y levadura. Nosotros la hacemos con miel mexicana y un toque moderno. Suave, aromática y hecha para brindar.', 'The oldest fermented drink in the world: honey, water and yeast. We make ours with Mexican honey and a modern touch. Smooth, aromatic and made for toasting.', '세계에서 가장 오래된 발효 음료입니다. 꿀, 물, 효모로 만듭니다. 우리는 멕시코 꿀과 현대적인 감각을 더해 부드럽고 향긋하게 만듭니다.'],
        ['legal.termsP1', 'Al navegar, comprar o registrarte en este sitio aceptas estos Términos y Condiciones. Si no estás de acuerdo con ellos, te pedimos no usar el sitio. Estos términos pueden actualizarse; la versión vigente es la publicada en esta página.', 'By browsing, purchasing or registering on this site, you accept these Terms and Conditions. If you do not agree, please do not use the site. These terms may be updated; the current version is the one published on this page.', '이 사이트를 탐색하거나 구매하거나 가입하면 본 이용약관에 동의하는 것입니다. 동의하지 않는 경우 사이트를 이용하지 마세요. 약관은 변경될 수 있으며 현재 버전은 이 페이지에 게시됩니다.'],
        ['legal.termsP2', 'Queens Hidro elabora y comercializa hidromiel artesanal, una bebida fermentada a base de miel, fruta, agua y levadura, con un contenido alcohólico de 5% a 12% según la edición.', 'Queens Hidro makes and sells craft mead, a fermented drink made from honey, fruit, water and yeast, with an alcohol content of 5% to 12% depending on the edition.', 'Queens Hidro는 꿀, 과일, 물, 효모를 발효해 만든 수제 미드를 제조·판매하며, 에디션에 따라 알코올 도수는 5%에서 12%입니다.'],
        ['legal.adults', 'Mayores de edad:', 'Adults only:', '성인 전용:'],
        ['legal.adultsText', 'la venta está prohibida a menores de 18 años. Al hacer tu pedido confirmas que eres mayor de edad.', 'sales to anyone under 18 are prohibited. By placing an order, you confirm that you are of legal drinking age.', '18세 미만에게 판매할 수 없습니다. 주문할 때 법정 음주 연령임을 확인하는 것입니다.'],
        ['legal.responsible', 'Consumo responsable:', 'Responsible consumption:', '책임 있는 음주:'],
        ['legal.responsibleText', 'te invitamos a disfrutar con moderación y a no conducir después de consumir alcohol.', 'please enjoy in moderation and do not drive after consuming alcohol.', '적당히 즐기고 음주 후 운전하지 마세요.'],
        ['legal.natural', 'Variación natural:', 'Natural variation:', '자연스러운 차이:'],
        ['legal.naturalText', 'al ser un producto artesanal, cada lote puede variar ligeramente en aroma, color y sabor. Esto es parte de su carácter.', 'as a craft product, each batch may vary slightly in aroma, color and flavor. That is part of its character.', '수제 제품이므로 배치마다 향, 색, 맛이 조금씩 다를 수 있습니다. 이것이 제품의 특징입니다.'],
        ['legal.termsP3', 'Los precios están expresados en pesos mexicanos (MXN), incluyen impuestos y pueden cambiar sin previo aviso; aplicará el precio vigente al momento de confirmar tu pedido.', 'Prices are shown in Mexican pesos (MXN), include taxes and may change without notice; the price in effect when your order is confirmed will apply.', '가격은 멕시코 페소(MXN)로 표시되며 세금이 포함되어 있습니다. 사전 통지 없이 변경될 수 있고 주문 확정 시점의 가격이 적용됩니다.'],
        ['legal.orderNumber', 'Tu pedido se confirma cuando queda registrado con número de orden.', 'Your order is confirmed once it is registered with an order number.', '주문 번호가 등록되면 주문이 확정됩니다.'],
        ['legal.cancelStock', 'Nos reservamos el derecho de cancelar pedidos por falta de stock, errores de precio o imposibilidad de entrega; en ese caso te reembolsamos el monto pagado.', 'We reserve the right to cancel orders due to lack of stock, pricing errors or inability to deliver; in that case, we will refund the amount paid.', '재고 부족, 가격 오류 또는 배송 불가로 주문을 취소할 수 있으며, 이 경우 결제 금액을 환불합니다.'],
        ['legal.promotions', 'Las promociones y ediciones limitadas tienen vigencia y disponibilidad propias.', 'Promotions and limited editions have their own validity periods and availability.', '프로모션과 한정 에디션은 각각 유효 기간과 판매 가능 수량이 다릅니다.'],
        ['legal.paymentsP', 'Aceptamos pagos en línea vía Mercado Pago (tarjeta de crédito o débito) y transferencia bancaria, conforme al método que elijas en el proceso de compra.', 'We accept online payments through Mercado Pago (credit or debit card) and bank transfer, according to the method you choose during checkout.', 'Mercado Pago(신용·체크카드) 온라인 결제와 계좌이체를 구매 과정에서 선택할 수 있습니다.'],
        ['legal.provider', 'Los pagos en línea son procesados por el proveedor de pagos; Queens Hidro no almacena datos de tu tarjeta.', 'Online payments are processed by the payment provider; Queens Hidro does not store your card details.', '온라인 결제는 결제 제공업체가 처리하며 Queens Hidro는 카드 정보를 저장하지 않습니다.'],
        ['legal.transfer', 'En pagos por transferencia, el pedido se confirma al recibir y verificar tu comprobante por el total exacto.', 'For bank transfers, the order is confirmed once we receive and verify your receipt for the exact total.', '계좌이체 주문은 정확한 금액의 입금 확인증을 받고 확인한 뒤 확정됩니다.'],
        ['legal.membershipP', 'La membresía es gratuita: al registrarte con tu correo obtienes acceso a ediciones limitadas, descuentos, catas privadas y contenido exclusivo.', 'Membership is free: by registering with your email, you get access to limited editions, discounts, private tastings and exclusive content.', '멤버십은 무료입니다. 이메일로 가입하면 한정 에디션, 할인, 프라이빗 시음 및 독점 콘텐츠를 이용할 수 있습니다.'],
        ['legal.personal', 'El registro es personal e intransferible.', 'Registration is personal and non-transferable.', '가입 정보는 개인용이며 양도할 수 없습니다.'],
        ['legal.recurring', 'La suscripción con envío recurrente se activa con el pago y puede cancelarse en cualquier momento conforme a sus términos.', 'A recurring-shipping membership activates with payment and may be cancelled at any time according to its terms.', '정기 배송 멤버십은 결제와 함께 활성화되며 약관에 따라 언제든 취소할 수 있습니다.'],
        ['legal.benefits', 'Nos reservamos el derecho de modificar o suspender beneficios de la membresía con aviso previo.', 'We reserve the right to modify or suspend membership benefits with prior notice.', '사전 안내 후 멤버십 혜택을 변경하거나 중단할 수 있습니다.'],
        ['legal.ipP', 'El nombre Queens Hidro, el logotipo, los textos, imágenes, videos y demás contenido de este sitio son propiedad de Queens Hidro y están protegidos por la legislación mexicana de propiedad intelectual. No podrás reproducirlos, distribuirlos ni usarlos con fines comerciales sin autorización.', 'The Queens Hidro name, logo, text, images, videos and other content on this site are owned by Queens Hidro and protected by Mexican intellectual property law. You may not reproduce, distribute or use them commercially without authorization.', 'Queens Hidro의 이름, 로고, 텍스트, 이미지, 영상 및 기타 사이트 콘텐츠는 Queens Hidro의 소유이며 멕시코 지식재산권법의 보호를 받습니다. 허가 없이 복제, 배포 또는 상업적으로 사용할 수 없습니다.'],
        ['legal.liabilityP', 'Queens Hidro no será responsable por daños indirectos derivados del uso del sitio o de la compra de sus productos, salvo lo dispuesto por la ley aplicable. En ningún caso, nuestra responsabilidad total excederá el monto pagado por tu pedido.', 'Queens Hidro is not liable for indirect damages arising from use of the site or purchase of its products, except as provided by applicable law. In no event will our total liability exceed the amount paid for your order.', '관련 법률에서 정한 경우를 제외하고 Queens Hidro는 사이트 이용이나 제품 구매로 인한 간접 손해에 책임을 지지 않습니다. 어떠한 경우에도 총 책임은 주문 결제 금액을 초과하지 않습니다.'],
        ['legal.lawP', 'Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a los tribunales competentes de Monterrey, Nuevo León.', 'These terms are governed by the laws of the United Mexican States. For any dispute, the parties submit to the competent courts of Monterrey, Nuevo León.', '본 약관은 멕시코 합중국 법률의 적용을 받습니다. 분쟁이 발생하면 당사자는 누에보레온 몬테레이 관할 법원에 따릅니다.'],
        ['legal.contactTerms', 'Si tienes dudas sobre estos términos, escríbenos a', 'If you have questions about these terms, email us at', '약관에 관한 문의는 다음 이메일로 보내 주세요:'],
        ['legal.orInstagram', 'o mándanos un mensaje por Instagram', 'or message us on Instagram', '또는 Instagram으로 메시지를 보내 주세요:'],
        ['legal.riskP', 'El riesgo del producto pasa a ti al momento de la entrega. Si tu pedido llega dañado o quebrado, revisa nuestra', 'Risk passes to you upon delivery. If your order arrives damaged or broken, see our', '제품의 위험은 배송 시 고객에게 이전됩니다. 주문이 손상되거나 깨져 도착했다면 다음 정책을 확인하세요:'],
        ['legal.howProceed', 'para saber cómo proceder.', 'to learn what to do.', '처리 방법을 확인하세요.'],
        ['legal.coverageP', 'Enviamos a toda la República Mexicana. Para consumidores te decimos dónde conseguir nuestra hidromiel y para negocios ofrecemos precios por volumen: revisa', 'We ship throughout Mexico. For consumers, we can tell you where to find our mead; for businesses, we offer volume pricing: see', '멕시코 전역으로 배송합니다. 소비자에게는 판매처를 안내하고 사업자에게는 대량 구매 가격을 제공합니다:'],
        ['legal.termsShippingP', 'Los envíos se realizan a toda la República Mexicana. Los tiempos, costos y condiciones de entrega están descritos en nuestras', 'Shipments are made throughout Mexico. Delivery times, costs and conditions are described in our', '멕시코 전역으로 배송합니다. 배송 기간, 비용 및 조건은 다음 정책에 설명되어 있습니다:'],
        ['legal.preparationP', 'Una vez confirmado tu pago, tu pedido entra en preparación en un plazo de', 'Once your payment is confirmed, your order enters preparation within', '결제가 확인되면 주문 준비에'],
        ['legal.businessDays', '1 a 3 días hábiles', '1 to 3 business days', '영업일 기준 1~3일'],
        ['legal.preparationEnd', '. Cada botella se revisa antes de empacarse y se envuelve con protección para el traslado.', '. Each bottle is inspected before packing and wrapped for transport.', '. 각 병은 포장 전에 확인하고 운송 중 보호 포장합니다.'],
        ['legal.deliveryP', 'La entrega estimada es de', 'Estimated delivery is', '예상 배송 기간은'],
        ['legal.deliveryEnd', ', contados a partir de la salida del pedido. El plazo puede variar según la ubicación y el transportista.', ', counted from when the order leaves us. Timing may vary by location and carrier.', '이며 주문 출고일부터 계산합니다. 지역과 운송업체에 따라 달라질 수 있습니다.'],
        ['legal.tracking', 'Te compartimos el número de rastreo en cuanto tu paquete salga.', 'We will share the tracking number as soon as your package leaves.', '패키지가 출고되는 즉시 배송 추적 번호를 공유합니다.'],
        ['legal.estimate', 'El plazo es estimado y puede extenderse por condiciones del transportista o del destino.', 'The timing is an estimate and may be extended by carrier or destination conditions.', '배송 기간은 예상치이며 운송업체나 목적지 상황에 따라 늘어날 수 있습니다.'],
        ['legal.costP', 'El costo de envío se calcula al momento del checkout según tu dirección y el tamaño del pedido. En promociones y suscripciones de membresía pueden aplicarse envíos preferentes o incluidos; consulta los términos de cada plan.', 'Shipping cost is calculated at checkout based on your address and order size. Promotions and memberships may include preferred or free shipping; check each plan\'s terms.', '배송비는 주소와 주문 규모에 따라 결제 단계에서 계산됩니다. 프로모션과 멤버십에는 우대 또는 무료 배송이 적용될 수 있으니 각 플랜의 약관을 확인하세요.'],
        ['legal.packagingP', 'Nuestras botellas son de vidrio y se empacan con separadores y material de amortiguamiento. Maneja el paquete con cuidado: aunque el empaque está diseñado para el traslado, ninguna caja es indestructible.', 'Our bottles are glass and packed with dividers and cushioning material. Handle the package with care: although the packaging is designed for transport, no box is indestructible.', '병은 유리 제품이며 칸막이와 완충재로 포장합니다. 포장을 조심히 다뤄 주세요. 배송용으로 설계되었지만 어떤 상자도 완전히 파손되지 않는 것은 아닙니다.'],
        ['legal.damagedBold', '¿Tu pedido llegó dañado o quebrado?', 'Did your order arrive damaged or broken?', '주문이 손상되거나 깨져 도착했나요?'],
        ['legal.damagedP', 'No te preocupes: escríbenos dentro de las 48 horas siguientes a la entrega con fotografías del paquete y de las botellas, y nuestro equipo evaluará cómo reemplazar los productos que llegaron dañados.', 'Do not worry: contact us within 48 hours of delivery with photos of the package and bottles, and our team will review how to replace the damaged products.', '걱정하지 마세요. 배송 후 48시간 이내에 포장과 병 사진을 보내 주시면 팀에서 손상된 제품의 교환 방법을 검토합니다.'],
        ['legal.consult', 'Consulta nuestra', 'See our', '다음 정책을 확인하세요:'],
        ['legal.failedP', 'Si el transportista no puede entregar por dirección incorrecta o ausencia del receptor, el paquete puede regresar a nosotros. En ese caso te contactaremos para coordinar un nuevo envío; los costos adicionales por reenvío corren por cuenta del cliente, salvo error atribuible a Queens Hidro.', 'If the carrier cannot deliver because of an incorrect address or no recipient, the package may return to us. We will contact you to arrange a new shipment; additional reshipping costs are the customer\'s responsibility unless the error was attributable to Queens Hidro.', '주소 오류나 수령인 부재로 배송하지 못하면 패키지가 반송될 수 있습니다. 새 배송을 조율하기 위해 연락드리며, Queens Hidro의 귀책이 아닌 경우 재배송 비용은 고객 부담입니다.'],
        ['legal.contactShipping', 'Dudas sobre tu envío:', 'Questions about your shipment:', '배송 문의:'],
        ['legal.orInstagramShort', 'o Instagram', 'or Instagram', '또는 Instagram'],
        ['legal.orderNumberEnd', 'Ten a la mano tu número de orden.', 'Have your order number ready.', '주문 번호를 준비해 주세요.'],
        ['legal.privacyResponsibleP', 'Queens Hidro SAS de CV es responsable del uso y protección de tus datos personales. Para cualquier asunto relacionado con este aviso puedes escribir a', 'Queens Hidro SAS de CV is responsible for the use and protection of your personal data. For any matter related to this notice, email', 'Queens Hidro SAS de CV는 개인정보의 이용과 보호를 책임집니다. 본 방침에 관한 문의는 다음 이메일로 보내 주세요:'],
        ['legal.collectP', 'Dependiendo de la acción que realices, podemos solicitar:', 'Depending on the action you take, we may request:', '이용하는 서비스에 따라 다음 정보를 요청할 수 있습니다:'],
        ['legal.identification', 'Identificación y contacto:', 'Identification and contact:', '신원 및 연락처:'],
        ['legal.identificationText', 'nombre, correo electrónico y teléfono.', 'name, email address and phone number.', '이름, 이메일, 전화번호'],
        ['legal.deliveryData', 'Entrega:', 'Delivery:', '배송:'],
        ['legal.deliveryDataText', 'calle, número, colonia, ciudad o municipio, estado y código postal.', 'street, number, neighborhood, city or municipality, state and postal code.', '도로명, 번지, 지역, 도시 또는 시·군, 주/도, 우편번호'],
        ['legal.accountData', 'Cuenta y compras:', 'Account and purchases:', '계정 및 구매:'],
        ['legal.accountDataText', 'historial de pedidos, productos, membresía, preferencias y comunicaciones contigo.', 'order history, products, membership, preferences and communications with you.', '주문 내역, 제품, 멤버십, 선호 사항 및 연락 기록'],
        ['legal.paymentData', 'Pago:', 'Payment:', '결제:'],
        ['legal.paymentDataText', 'método elegido, referencia y estado de la transacción. Los datos completos de tu tarjeta son procesados por Mercado Pago y no son almacenados por Queens Hidro.', 'chosen method, reference and transaction status. Full card details are processed by Mercado Pago and are not stored by Queens Hidro.', '선택한 결제 방식, 거래 참조 및 상태. 카드 전체 정보는 Mercado Pago가 처리하며 Queens Hidro는 저장하지 않습니다.'],
        ['legal.siteUse', 'Uso del sitio:', 'Site use:', '사이트 이용:'],
        ['legal.siteUseText', 'información técnica, dispositivo, navegador, páginas visitadas y datos de cookies necesarios para que el sitio funcione.', 'technical information, device, browser, pages visited and cookie data needed for the site to work.', '사이트 운영에 필요한 기술 정보, 기기, 브라우저, 방문 페이지 및 쿠키 정보'],
        ['legal.primaryP', 'Usamos tus datos para las finalidades necesarias para prestar el servicio:', 'We use your data for the purposes necessary to provide the service:', '서비스 제공에 필요한 목적으로 개인정보를 이용합니다:'],
        ['legal.createAccount', 'Crear y administrar tu cuenta o membresía.', 'Create and manage your account or membership.', '계정 또는 멤버십 생성 및 관리'],
        ['legal.processOrders', 'Procesar pedidos, pagos, suscripciones y envíos.', 'Process orders, payments, memberships and shipments.', '주문, 결제, 멤버십 및 배송 처리'],
        ['legal.contactOrder', 'Contactarte sobre el estado de tu pedido, pago o entrega.', 'Contact you about the status of your order, payment or delivery.', '주문, 결제 또는 배송 상태에 대해 연락'],
        ['legal.questions', 'Atender preguntas, solicitudes, aclaraciones y reportes de productos dañados.', 'Handle questions, requests, clarifications and reports of damaged products.', '문의, 요청, 확인 및 손상 제품 신고 처리'],
        ['legal.fraud', 'Prevenir operaciones fraudulentas, proteger el sitio y cumplir obligaciones legales.', 'Prevent fraud, protect the site and comply with legal obligations.', '사기 방지, 사이트 보호 및 법적 의무 준수'],
        ['legal.secondaryP', 'Con tu autorización, podemos usar tus datos para enviarte novedades, promociones, invitaciones a eventos, encuestas y contenido de Queens Hidro. Puedes oponerte a recibir comunicaciones comerciales escribiendo a', 'With your authorization, we may use your data to send news, promotions, event invitations, surveys and Queens Hidro content. You may opt out of commercial communications by emailing', '동의한 경우 새로운 소식, 프로모션, 이벤트 초대, 설문 및 Queens Hidro 콘텐츠를 보낼 수 있습니다. 상업적 연락을 원하지 않으면 다음 이메일로 알려 주세요:'],
        ['legal.orUnsubscribe', 'o usando el mecanismo de baja incluido en cada mensaje.', 'or using the unsubscribe mechanism included in each message.', '또는 각 메시지의 수신 거부 기능을 이용하세요.'],
        ['legal.providersP', 'Para operar la tienda podemos compartir los datos estrictamente necesarios con proveedores que nos ayudan a procesar pagos, alojar la plataforma, enviar pedidos, enviar correos y dar soporte. Estos proveedores solo deben utilizarlos para prestar el servicio contratado.', 'To operate the shop, we may share strictly necessary data with providers that help process payments, host the platform, ship orders, send emails and provide support. These providers may use it only to provide the contracted service.', '쇼핑몰 운영을 위해 결제 처리, 플랫폼 호스팅, 주문 배송, 이메일 발송 및 지원을 돕는 서비스 제공자와 필요한 범위의 정보를 공유할 수 있습니다. 제공자는 계약된 서비스를 위해서만 이를 이용해야 합니다.'],
        ['legal.authorityP', 'También podremos compartir información cuando una autoridad competente lo solicite o cuando sea necesario para cumplir una obligación legal.', 'We may also share information when a competent authority requests it or when necessary to comply with a legal obligation.', '관할 기관의 요청이 있거나 법적 의무를 이행하기 위해 필요한 경우 정보를 제공할 수 있습니다.'],
        ['legal.arcoP', 'Puedes ejercer tus derechos de', 'You may exercise your rights of', '다음 권리를 행사할 수 있습니다:'],
        ['legal.arcoBold', 'Acceso, Rectificación, Cancelación u Oposición (ARCO)', 'Access, Rectification, Cancellation or Opposition (ARCO)', '열람, 정정, 삭제 또는 이의 제기(ARCO)'],
        ['legal.arcoEnd', ', así como revocar tu consentimiento o limitar el uso de tus datos, mediante una solicitud a', ', as well as withdraw your consent or limit the use of your data, by submitting a request to', ', 동의를 철회하거나 개인정보 이용을 제한하려면 다음 이메일로 신청하세요:'],
        ['legal.arcoDetails', 'La solicitud debe incluir tu nombre, medio para recibir respuesta, una descripción clara de lo que solicitas y, cuando corresponda, los datos que deseas corregir o cancelar. Podemos pedir información para verificar tu identidad. Responderemos dentro de los plazos previstos por la legislación aplicable.', 'The request must include your name, a way to receive a response, a clear description of what you are requesting and, where applicable, the data you want corrected or cancelled. We may ask for information to verify your identity. We will respond within the periods established by applicable law.', '신청서에는 이름, 답변을 받을 방법, 요청 내용의 명확한 설명, 해당하는 경우 정정 또는 삭제를 원하는 정보를 포함해야 합니다. 신원 확인을 위한 정보를 요청할 수 있으며 관련 법률의 기간 내에 답변합니다.'],
        ['legal.cookiesP', 'Usamos cookies y tecnologías similares para mantener funciones esenciales, recordar preferencias, conservar el carrito y entender cómo se usa el sitio. Puedes bloquearlas desde tu navegador; algunas funciones podrían dejar de operar correctamente.', 'We use cookies and similar technologies to maintain essential functions, remember preferences, preserve your cart and understand site usage. You can block them in your browser; some features may no longer work correctly.', '필수 기능 유지, 환경 설정 기억, 장바구니 보존 및 사이트 이용 분석을 위해 쿠키와 유사 기술을 사용합니다. 브라우저에서 차단할 수 있지만 일부 기능이 제대로 작동하지 않을 수 있습니다.'],
        ['legal.minorsP', 'La venta de bebidas alcohólicas está prohibida a menores de 18 años. No buscamos recabar intencionalmente datos de menores. Si una persona tutora identifica que un menor nos proporcionó datos, puede solicitar su eliminación por medio de nuestro correo de contacto.', 'The sale of alcoholic beverages to anyone under 18 is prohibited. We do not intentionally seek data from minors. If a parent or guardian learns that a minor provided us with data, they may request its deletion through our contact email.', '18세 미만에게 주류를 판매할 수 없습니다. 미성년자의 정보를 의도적으로 수집하지 않습니다. 보호자가 미성년자가 정보를 제공한 사실을 확인하면 문의 이메일을 통해 삭제를 요청할 수 있습니다.'],
        ['legal.changesP', 'Podemos actualizar este aviso para reflejar cambios en nuestras operaciones o en la legislación. Publicaremos la versión vigente en esta página e indicaremos la fecha de actualización.', 'We may update this notice to reflect changes in our operations or the law. We will publish the current version on this page and indicate the update date.', '운영이나 법률의 변경을 반영하기 위해 본 방침을 업데이트할 수 있습니다. 현재 버전을 이 페이지에 게시하고 업데이트 날짜를 표시합니다.'],
        ['legal.personalQuestions', 'Si tienes preguntas sobre tus datos personales, escríbenos a', 'If you have questions about your personal data, email', '개인정보에 관한 문의는 다음 이메일로 보내 주세요:'],
        ['legal.orInstagramPrivacy', 'o por Instagram', 'or through Instagram', '또는 Instagram으로'],
        ['legal.noOrdinaryP', 'Por tratarse de una bebida alcohólica y un producto de consumo,', 'Because this is an alcoholic beverage and a consumable product,', '주류 및 소비 제품의 특성상'],
        ['legal.noOrdinaryBold', 'no aceptamos devoluciones ni reembolsos por cambio de opinión, sabor, preferencia o compra incorrecta', 'we do not accept returns or refunds due to a change of mind, taste, preference or incorrect purchase', '단순 변심, 맛이나 선호도, 잘못된 구매로 인한 반품 및 환불은 받지 않습니다'],
        ['legal.noOrdinaryEnd', 'una vez entregado el pedido. Esta política no limita los derechos que no puedan excluirse conforme a la legislación aplicable.', 'once the order has been delivered. This policy does not limit rights that cannot be excluded under applicable law.', '주문이 배송된 후에는 불가합니다. 단, 관련 법률상 제한할 수 없는 권리를 제한하는 정책은 아닙니다.'],
        ['legal.reportDamage', 'Si una o más botellas llegaron dañadas, quebradas o con derrame, escríbenos tan pronto como recibas el pedido, preferentemente dentro de las primeras 48 horas, a', 'If one or more bottles arrived damaged, broken or leaking, contact us as soon as you receive the order, preferably within the first 48 hours, at', '한 병 이상이 손상되거나 깨졌거나 내용물이 샜다면 주문을 받은 즉시, 가급적 48시간 이내에 다음으로 연락해 주세요:'],
        ['legal.keepBox', 'No tires la caja ni los materiales del empaque', 'Do not throw away the box or packaging materials', '상자와 포장재를 버리지 마세요'],
        ['legal.keepBoxEnd', 'hasta que el equipo termine la revisión. No consumas un producto cuyo envase esté roto, abierto o contaminado.', 'until our team completes its review. Do not consume a product whose container is broken, open or contaminated.', '팀의 확인이 끝날 때까지 보관하세요. 용기가 깨졌거나 열렸거나 오염된 제품은 마시지 마세요.'],
        ['legal.reviewNeeds', 'Incluye en tu mensaje:', 'Include in your message:', '문의에 다음을 포함하세요:'],
        ['legal.orderName', 'Número de pedido y nombre de la persona que compró.', 'Order number and name of the purchaser.', '주문 번호와 구매자 이름'],
        ['legal.boxPhotos', 'Fotografías de la caja por fuera, incluyendo cualquier daño visible.', 'Photos of the outside of the box, including any visible damage.', '눈에 보이는 손상을 포함한 상자 외부 사진'],
        ['legal.insidePhotos', 'Fotografías del empaque interior y de cada botella dañada o quebrada.', 'Photos of the inside packaging and each damaged or broken bottle.', '내부 포장과 손상되거나 깨진 각 병의 사진'],
        ['legal.labelPhoto', 'Fotografía de la etiqueta o lote, cuando sea posible.', 'A photo of the label or lot, when possible.', '가능하면 라벨 또는 로트 사진'],
        ['legal.description', 'Una breve descripción de lo ocurrido. Un video de apertura también puede ayudar, aunque no es indispensable.', 'A brief description of what happened. An opening video may also help, although it is not required.', '상황에 대한 간단한 설명. 개봉 영상도 도움이 될 수 있지만 필수는 아닙니다.'],
        ['legal.reviewP', 'Nuestro equipo revisará las fotografías y la información del pedido.', 'Our team will review the photos and order information.', '팀에서 사진과 주문 정보를 검토합니다.'],
        ['legal.notAutomatic', 'El reemplazo no es automático:', 'Replacement is not automatic:', '교환은 자동으로 처리되지 않습니다:'],
        ['legal.evaluate', 'evaluaremos cada caso y te comunicaremos la resolución.', 'we will evaluate each case and communicate the resolution.', '각 사례를 검토한 뒤 결과를 안내합니다.'],
        ['legal.replaceP', 'Si aprobamos el reporte, podremos reemplazar las botellas afectadas o proponer una solución equivalente, de acuerdo con la disponibilidad y las condiciones del caso. La decisión se refiere a los productos que llegaron quebrados o dañados; no implica automáticamente la devolución del pedido completo.', 'If we approve the report, we may replace the affected bottles or propose an equivalent solution, depending on availability and the circumstances. The decision applies to products that arrived broken or damaged; it does not automatically mean a full order return.', '신고가 승인되면 재고와 상황에 따라 손상된 병을 교환하거나 동등한 해결책을 제안할 수 있습니다. 결정은 깨지거나 손상되어 도착한 제품에 한하며 주문 전체의 반품을 자동으로 의미하지 않습니다.'],
        ['legal.wrongOrderP', 'Si recibiste un producto distinto al que aparece en tu confirmación o falta alguna pieza, repórtalo a', 'If you received a product different from the one in your confirmation or an item is missing, report it to', '확인서와 다른 제품을 받았거나 상품이 누락된 경우 다음으로 신고해 주세요:'],
        ['legal.wrongOrderEnd', 'con fotografías del contenido y tu número de pedido. Revisaremos el caso y te indicaremos la solución correspondiente.', 'with photos of the contents and your order number. We will review the case and tell you the appropriate solution.', '내용물 사진과 주문 번호를 보내 주세요. 확인 후 해결 방법을 안내합니다.'],
        ['legal.returnsContact', 'También puedes escribirnos por Instagram', 'You can also contact us through Instagram', 'Instagram으로도 문의할 수 있습니다:'],
        ['legal.returnsContactEnd', 'Para agilizar la atención, incluye tu número de orden y las fotografías desde el primer mensaje.', 'To speed up support, include your order number and photos in your first message.', '빠른 처리를 위해 첫 메시지에 주문 번호와 사진을 포함해 주세요.'],
        ['legal.orderQuestion', '¿Tienes una duda sobre tu pedido?', 'Have a question about your order?', '주문에 대해 궁금한 점이 있나요?'],
        ['legal.writeUs', 'Escríbenos', 'Write to us', '문의하기']
    ]);

    var META = {
        'index.html': ['Queens Hidro | Hidromiel Artesanal — Experiencia Queens', 'Queens Hidro — Hidromiel artesanal de fruta real y miel mexicana. Cada botella apoya a los apicultores de Nuevo León. Compra en línea o encuéntranos en Monterrey.', 'Queens Hidro | Craft Mead — The Queens Experience', 'Craft mead made with real fruit and Mexican honey. Every bottle supports beekeepers in Nuevo León. Shop online or find us in Monterrey.', 'Queens Hidro | 수제 미드 - Queens 경험', '진짜 과일과 멕시코 꿀로 만든 Queens Hidro 수제 미드. 한 병마다 누에보레온의 양봉가를 응원합니다. 온라인으로 구매하거나 몬테레이에서 만나 보세요.'],
        'tienda.html': ['Tienda | Queens Hidro', 'Compra hidromiel artesanal Queens Hidro en línea. Ediciones limitadas de fruta real y miel mexicana hechas en Monterrey. Envíos a todo México.', 'Shop | Queens Hidro', 'Shop Queens Hidro craft mead online. Limited editions made with real fruit and Mexican honey in Monterrey. Shipping throughout Mexico.', '쇼핑몰 | Queens Hidro', '몬테레이에서 진짜 과일과 멕시코 꿀로 만든 Queens Hidro 수제 미드를 구매하세요. 멕시코 전역 배송.'],
        'membresia.html': ['Suscripción | Queens Hidro', 'Suscríbete a Queens Hidro y recibe hidromiel artesanal a tu puerta cada mes en zona MTY. Envío incluido, ediciones limitadas y precios de miembro.', 'Membership | Queens Hidro', 'Join Queens Hidro and receive craft mead at your door every month in the MTY area. Shipping included, limited editions and member pricing.', '멤버십 | Queens Hidro', 'Queens Hidro 멤버십에 가입하고 MTY 지역에서 매달 수제 미드를 받아 보세요. 배송비 포함, 한정 에디션 및 회원 가격 제공.'],
        'distribuye-queens.html': ['Degustación Queens | Queens Hidro', 'Solicita una degustación de Queens Hidro para tu negocio. Visitas en Monterrey y área metropolitana; solicitudes de degustación para todo México.', 'Queens Tasting | Queens Hidro', 'Request a Queens Hidro tasting for your business. Visits in Monterrey and the metropolitan area; tasting requests throughout Mexico.', 'Queens 시음 | Queens Hidro', '매장을 위한 Queens Hidro 시음을 신청하세요. 몬테레이 및 광역 지역 방문, 멕시코 전역 시음 신청 가능.'],
        'eventos.html': ['Eventos | Queens Hidro', 'Consulta las próximas fechas de Queens Hidro. Próximos eventos por anunciar.', 'Events | Queens Hidro', 'See upcoming Queens Hidro dates. Upcoming events to be announced.', '이벤트 | Queens Hidro', 'Queens Hidro의 다음 일정을 확인하세요. 예정된 이벤트를 곧 알려 드립니다.'],
        'nosotros.html': ['Nosotros | Queens Hidro', 'Conoce Queens Hidro — hidromiel artesanal hecho en México con fruta real y miel de apicultores de Nuevo León. Historia, comunidad y FAQs.', 'About us | Queens Hidro', 'Meet Queens Hidro — craft mead made in Mexico with real fruit and honey from Nuevo León beekeepers. Our story, community and FAQs.', '소개 | Queens Hidro', 'Queens Hidro를 만나 보세요. 진짜 과일과 누에보레온 양봉가의 꿀로 멕시코에서 만든 수제 미드입니다. 이야기, 커뮤니티, FAQ.'],
        'servicios.html': ['Servicios | Queens Hidro — Estudio creativo', 'Diseño de marca, etiquetas, desarrollo web y contenido para proyectos con algo que decir.', 'Services | Queens Hidro — Creative studio', 'Brand design, labels, web development and content for projects with something to say.', '서비스 | Queens Hidro - 크리에이티브 스튜디오', '할 말이 있는 프로젝트를 위한 브랜드 디자인, 라벨, 웹 개발 및 콘텐츠.'],
        'faqs.html': ['FAQs | Queens Hidro', 'Preguntas frecuentes sobre Queens Hidro — qué es el hidromiel, cómo se toma, envíos, membresía e ingredientes.', 'FAQs | Queens Hidro', 'Frequently asked questions about Queens Hidro — what mead is, how to serve it, shipping, membership and ingredients.', '자주 묻는 질문 | Queens Hidro', '미드, 음용 방법, 배송, 멤버십, 원료에 대한 Queens Hidro 자주 묻는 질문.'],
        'login.html': ['Ingresar | Queens Hidro', 'Accede a tu cuenta de Queens Hidro. La experiencia Queens te espera.', 'Log in | Queens Hidro', 'Access your Queens Hidro account. The Queens experience is waiting for you.', '로그인 | Queens Hidro', 'Queens Hidro 계정에 로그인하세요. Queens 경험이 기다리고 있습니다.'],
        'cuenta.html': ['Mi Cuenta | Queens Hidro', 'Administra tu cuenta, membresía y pedidos de Queens Hidro. Ediciones limitadas, envíos y beneficios de miembro.', 'My Account | Queens Hidro', 'Manage your Queens Hidro account, membership and orders. Limited editions, shipping and member benefits.', '내 계정 | Queens Hidro', 'Queens Hidro 계정, 멤버십 및 주문을 관리하세요. 한정 에디션, 배송 및 회원 혜택.'],
        'carrito.html': ['Carrito | Queens Hidro', 'Revisa tu carrito y finaliza la compra de hidromiel artesanal Queens Hidro. Envíos a todo México.', 'Cart | Queens Hidro', 'Review your cart and complete your Queens Hidro craft mead purchase. Shipping throughout Mexico.', '장바구니 | Queens Hidro', '장바구니를 확인하고 Queens Hidro 수제 미드 구매를 완료하세요. 멕시코 전역 배송.'],
        'terminos.html': ['Términos y Condiciones | Queens Hidro', 'Términos y Condiciones de Queens Hidro — reglas de uso del sitio, compras, pagos, envíos, membresía y limitación de responsabilidad.', 'Terms and Conditions | Queens Hidro', 'Queens Hidro Terms and Conditions — site use, purchases, payments, shipping, membership and limitation of liability.', '이용약관 | Queens Hidro', 'Queens Hidro 이용약관 - 사이트 이용, 구매, 결제, 배송, 멤버십 및 책임 제한에 관한 규칙.'],
        'politicas-envio.html': ['Políticas de Envío | Queens Hidro', 'Políticas de Envío de Queens Hidro — cobertura en toda la República, tiempos de preparación y entrega, empaque de botellas y manejo de pedidos dañados.', 'Shipping Policy | Queens Hidro', 'Queens Hidro Shipping Policy — nationwide coverage, preparation and delivery times, bottle packaging and damaged orders.', '배송 정책 | Queens Hidro', 'Queens Hidro 배송 정책 - 멕시코 전역 배송, 준비 및 배송 기간, 병 포장 및 손상된 주문 처리.'],
        'aviso-privacidad.html': ['Aviso de Privacidad | Queens Hidro', 'Aviso de Privacidad de Queens Hidro — información sobre los datos personales que recopilamos, sus finalidades y tus derechos ARCO.', 'Privacy Notice | Queens Hidro', 'Queens Hidro Privacy Notice — the personal data we collect, its purposes and your ARCO rights.', '개인정보 처리방침 | Queens Hidro', 'Queens Hidro 개인정보 처리방침 - 수집하는 개인정보, 이용 목적 및 개인정보 권리 안내.'],
        'devoluciones.html': ['Devoluciones | Queens Hidro', 'Política de Devoluciones de Queens Hidro — no hay devoluciones ordinarias por el tipo de producto; consulta qué hacer si una botella llegó dañada o quebrada.', 'Returns | Queens Hidro', 'Queens Hidro Returns Policy — ordinary returns are not accepted due to the product type; learn what to do if a bottle arrived damaged or broken.', '반품 | Queens Hidro', 'Queens Hidro 반품 정책 - 제품 특성상 일반 반품은 불가합니다. 병이 손상되거나 깨져 도착한 경우의 처리 방법을 확인하세요.']
    };

    function localeCode() {
        var stored = '';
        try { stored = localStorage.getItem('qh_lang') || ''; } catch (e) {}
        var query = new URLSearchParams(window.location.search).get('lang') || '';
        if (VALID[query]) return query;
        if (VALID[stored]) return stored;
        var browser = String(navigator.language || '').toLowerCase();
        if (browser.indexOf('ko') === 0) return 'ko';
        if (browser.indexOf('en') === 0) return 'en';
        return 'es';
    }

    var current = localeCode();

    function format(template, params) {
        return String(template == null ? '' : template).replace(/\{(\w+)\}/g, function (_, key) {
            return params && params[key] != null ? String(params[key]) : _;
        });
    }

    function t(key, params) {
        var item = entries[key];
        if (!item) return key;
        return format(item[current] || item.es, params);
    }

    function keyFor(value) {
        return sourceToKey[normalize(value)] || '';
    }

    function dynamicText(value) {
        var text = normalize(value);
        var match;
        if ((match = text.match(/^(\d+) producto(s)?$/))) return t(match[2] ? 'cart.products' : 'cart.product', { value: match[1] }).replace(/^/, match[1] + ' ');
        if ((match = text.match(/^(\d+) botellas\/mes — \$([\d,.]+) MXN$/))) return t('common.bottleOption', { value: match[1], price: match[2] });
        if ((match = text.match(/^(\d+) botellas\/mes$/))) return t('common.bottlesMonth', { value: match[1] });
        if ((match = text.match(/^(\d+) meses$/))) return t('common.months', { value: match[1] });
        if ((match = text.match(/^(\d+)% desc$/))) return t('common.discount', { value: match[1] });
        if ((match = text.match(/^(\d+)% extra por prepago$/))) return t('common.extraDiscount', { value: match[1] });
        if ((match = text.match(/^Hasta (\d+)% de descuento$/))) return t('membership.discountUpTo', { value: match[1] });
        if ((match = text.match(/^Ahorras (\d+)% por botella$/))) return t('common.savingsBottle', { value: match[1] });
        if ((match = text.match(/^Ahorras (\d+)% \+ (\d+)% extra por prepago$/))) return t('common.savingsExtra', { value: match[1], extra: match[2] });
        if ((match = text.match(/^\$([\d,.]+) MXN\/mes$/))) return t('common.monthlyAmount', { value: match[1] });
        if ((match = text.match(/^\$([\d,.]+) × (\d+)$/))) return t('common.monthlyTimes', { value: '$' + match[1], months: match[2] });
        if ((match = text.match(/^\$([\d,.]+) c\/u \(normal \$([\d,.]+)\)$/))) return t('common.perBottleNormal', { value: '$' + match[1], normal: match[2] });
        if ((match = text.match(/^\$150\.00\/mes$/))) return t('common.shippingMonth');
        if ((match = text.match(/^Slide (\d+)$/))) return t('common.slide', { value: match[1] });
        if ((match = text.match(/^Ir al contenido (\d+)$/))) return t('common.content', { value: match[1] });
        if ((match = text.match(/^Solo puedes pedir (\d+) de este producto$/))) return t('common.onlyProduct', { value: match[1] });
        if ((match = text.match(/^Máximo (\d+) por producto$/))) return t('common.maxProduct', { value: match[1] });
        if ((match = text.match(/^Máximo (\d+) de (.+) por pedido$/))) return t('common.maxNamed', { value: match[1], name: match[2] });
        if ((match = text.match(/^Solo quedan (\d+) de (.+), ajustamos la cantidad$/))) return t('common.availableOnly', { value: match[1], name: match[2] });
        if ((match = text.match(/^Error: (.+)$/))) return t('common.errorMessage', { message: match[1] });
        if ((match = text.match(/^Ahorro de \$([\d,.]+) vs pagar mes a mes$/))) return t('membership.saveVsMonthly', { value: match[1] });
        return '';
    }

    var segmentKeys = Object.keys(entries).sort(function (a, b) {
        return entries[b].es.length - entries[a].es.length;
    });

    function translateText(value) {
        var original = normalize(value);
        if (!original) return value;
        var key = keyFor(original);
        if (key) return t(key);
        var dynamic = dynamicText(original);
        if (dynamic) return dynamic;
        if (current === 'es') return value;

        var result = value;
        segmentKeys.forEach(function (candidate) {
            var source = entries[candidate].es;
            if (source.length < 4 || result.indexOf(source) < 0) return;
            result = result.split(source).join(t(candidate));
        });
        return result;
    }

    function withWhitespace(source, translated) {
        var leading = String(source).match(/^\s*/)[0];
        var trailing = String(source).match(/\s*$/)[0];
        return leading + translated.trim() + trailing;
    }

    function applyTextNode(node, remember) {
        if (!node || !node.nodeValue || !node.nodeValue.trim()) return;
        if (node.parentElement) {
            if (/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(node.parentElement.tagName)) return;
            if (node.parentElement.closest && node.parentElement.closest('.store__name,.store__desc,.modal__name,.modal__desc,.cart-item__name')) return;
        }
        var source = remember || (textSources && textSources.get(node));
        if (source == null) {
            source = node.nodeValue;
            if (textSources) textSources.set(node, source);
        }
        var translated = withWhitespace(source, translateText(source));
        if (node.nodeValue !== translated) {
            if (internalTextNodes) internalTextNodes.add(node);
            applying = true;
            node.nodeValue = translated;
            applying = false;
        }
    }

    var TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'aria-roledescription', 'alt'];
    function applyAttributes(element) {
        if (!element || element.nodeType !== 1) return;
        var attrs = attributeSources && attributeSources.get(element);
        if (!attrs) {
            attrs = {};
            if (attributeSources) attributeSources.set(element, attrs);
        }
        TRANSLATABLE_ATTRIBUTES.forEach(function (name) {
            if (!element.hasAttribute(name)) return;
            if (name === 'alt' && element.closest && element.closest('.store__card,.modal__gallery,.cart-item__img')) return;
            if (attrs[name] == null) attrs[name] = element.getAttribute(name);
            var value = attrs[name];
            var translated = translateText(value);
            if (element.getAttribute(name) !== translated) {
                if (internalAttributes) {
                    var own = internalAttributes.get(element) || {};
                    own[name] = true;
                    internalAttributes.set(element, own);
                }
                applying = true;
                element.setAttribute(name, translated);
                applying = false;
            }
        });
    }

    function walk(root) {
        if (!root) return;
        if (root.nodeType === 3) {
            applyTextNode(root);
            return;
        }
        if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
        if (root.nodeType === 1) applyAttributes(root);
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                var parent = node.parentElement;
                if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        var node;
        while ((node = walker.nextNode())) applyTextNode(node);
        if (root.querySelectorAll) {
            Array.prototype.forEach.call(root.querySelectorAll('*'), applyAttributes);
        }
    }

    function pageName() {
        var path = window.location.pathname.split('/').pop();
        return path || 'index.html';
    }

    function applyMeta() {
        var meta = META[pageName()];
        if (!meta) return;
        document.title = current === 'es' ? meta[0] : current === 'en' ? meta[2] : meta[4];
        var description = current === 'es' ? meta[1] : current === 'en' ? meta[3] : meta[5];
        var setMeta = function (selector, value) {
            var el = document.querySelector(selector);
            if (el) el.setAttribute('content', value);
        };
        setMeta('meta[name="description"]', description);
        setMeta('meta[property="og:title"]', document.title);
        setMeta('meta[property="og:description"]', description);
        setMeta('meta[name="twitter:title"]', document.title);
        setMeta('meta[name="twitter:description"]', description);
        setMeta('meta[property="og:locale"]', current === 'es' ? 'es_MX' : current === 'en' ? 'en_US' : 'ko_KR');
        if (document.documentElement) document.documentElement.lang = LOCALES[current];
        document.querySelectorAll('script[type="application/ld+json"]').forEach(function (script) {
            try {
                var data = JSON.parse(script.textContent);
                var update = function (value) {
                    if (!value || typeof value !== 'object') return;
                    if (Array.isArray(value)) return value.forEach(update);
                    if (value.inLanguage) value.inLanguage = LOCALES[current];
                    Object.keys(value).forEach(function (key) {
                        if (value[key] && typeof value[key] === 'object') update(value[key]);
                    });
                };
                update(data);
                script.textContent = JSON.stringify(data);
            } catch (e) {}
        });
    }

    function addKoreanFont() {
        if (document.getElementById('qh-korean-font')) return;
        var link = document.createElement('link');
        link.id = 'qh-korean-font';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap';
        document.head.appendChild(link);
    }

    function renderSwitcher() {
        var label = t('nav.language');
        return '<div class="qh-lang" role="group" aria-label="' + label + '">' +
            '<span class="qh-lang__label">' + label + '</span>' +
            '<button type="button" class="qh-lang__btn qh-lang-btn" data-locale="es" aria-pressed="' + (current === 'es' ? 'true' : 'false') + '">ES</button>' +
            '<button type="button" class="qh-lang__btn qh-lang-btn" data-locale="en" aria-pressed="' + (current === 'en' ? 'true' : 'false') + '">EN</button>' +
            '<button type="button" class="qh-lang__btn qh-lang-btn" data-locale="ko" aria-pressed="' + (current === 'ko' ? 'true' : 'false') + '">KO</button>' +
            '</div>';
    }

    function applyDocument() {
        applyMeta();
        if (current === 'ko') addKoreanFont();
        walk(document.body);
        document.querySelectorAll('.qh-lang').forEach(function (picker) {
            picker.setAttribute('aria-label', t('nav.language'));
            picker.querySelectorAll('.qh-lang-btn').forEach(function (button) {
                button.setAttribute('aria-pressed', button.getAttribute('data-locale') === current ? 'true' : 'false');
            });
        });
    }

    function setLocale(next) {
        if (!VALID[next]) return;
        current = next;
        try { localStorage.setItem('qh_lang', next); } catch (e) {}
        if (initialized) applyDocument();
        window.dispatchEvent(new CustomEvent('qh:langchange', { detail: { locale: LOCALES[next], language: next } }));
    }

    function init() {
        if (initialized) return;
        initialized = true;
        if (current === 'ko') addKoreanFont();
        if (window.MutationObserver) {
            observer = new MutationObserver(function (records) {
                if (applying) return;
                records.forEach(function (record) {
                    if (record.type === 'characterData') {
                        if (record.target.parentElement && /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(record.target.parentElement.tagName)) return;
                        if (internalTextNodes && internalTextNodes.has(record.target)) {
                            internalTextNodes.delete(record.target);
                            return;
                        }
                        if (textSources) textSources.set(record.target, record.target.nodeValue);
                        applyTextNode(record.target);
                    } else if (record.type === 'attributes') {
                        if (internalAttributes) {
                            var ownAttrs = internalAttributes.get(record.target);
                            if (ownAttrs && ownAttrs[record.attributeName]) {
                                delete ownAttrs[record.attributeName];
                                return;
                            }
                        }
                        var attrs = attributeSources && attributeSources.get(record.target);
                        if (attrs) attrs[record.attributeName] = record.target.getAttribute(record.attributeName);
                        applyAttributes(record.target);
                    } else {
                        Array.prototype.forEach.call(record.addedNodes, function (node) { walk(node); });
                    }
                });
            });
            observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: TRANSLATABLE_ATTRIBUTES });
        }
        applyDocument();
    }

    document.addEventListener('click', function (event) {
        var button = event.target.closest && event.target.closest('.qh-lang-btn');
        if (button) setLocale(button.getAttribute('data-locale'));
    });

    var api = {
        locale: function () { return LOCALES[current]; },
        language: function () { return current; },
        t: t,
        setLocale: setLocale,
        apply: applyDocument,
        switcher: renderSwitcher,
        cmsKey: function (key) { return CMS[key] || ''; },
        cmsText: function (key, fallback) {
            var semantic = CMS[key];
            return semantic ? t(semantic) : (fallback || '');
        },
        translate: translateText
    };
    window.QH = window.QH || {};
    window.QH.i18n = api;
    window.QH.t = t;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
