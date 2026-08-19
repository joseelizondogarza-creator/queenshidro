/* ============================================================
   QUEENS HIDRO — Chrome compartido
   Inyecta nav + footer, auth, carrito. Uso:
   <body data-nav="full|back|none" data-cart="true|false" data-foot="true|false" data-active="tienda">
   ============================================================ */
(function(){
    var SUPABASE_URL='https://lqyphfiolymbjnsglonj.supabase.co';
    var SUPABASE_KEY='sb_publishable_wEhcM5S2Y-8In-kDUfLeEA_AsiIcK0u';
    var sb=null;
    try{ sb=window.supabase?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null; }catch(e){ sb=null; }

    function normalizeEditableText(value){
        var text=String(value==null?'':value);
        if(text.normalize)text=text.normalize('NFC');
        return text
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'')
            .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\uFFFD]/g,'')
            .replace(/\u00A0/g,' ')
            .replace(/\r\n?/g,'\n');
    }

    var SAFE_RICH_TAGS={BR:true,EM:true,I:true,STRONG:true,B:true};
    var BLOCKED_RICH_TAGS={SCRIPT:true,STYLE:true,IFRAME:true,OBJECT:true,EMBED:true,IMG:true,SVG:true,MATH:true,LINK:true,META:true};

    function renderEditableRichText(element,value){
        if(!element)return;
        var source=document.createElement('template');
        source.innerHTML=normalizeEditableText(value);
        var fragment=document.createDocumentFragment();

        function appendNode(node,parent){
            if(node.nodeType===3){
                parent.appendChild(document.createTextNode(normalizeEditableText(node.nodeValue)));
                return;
            }
            if(node.nodeType!==1)return;
            var tag=node.tagName.toUpperCase();
            if(BLOCKED_RICH_TAGS[tag])return;
            if(tag==='BR'){
                parent.appendChild(document.createElement('br'));
                return;
            }
            if(tag==='DIV'||tag==='P'){
                Array.prototype.forEach.call(node.childNodes,function(child){appendNode(child,parent)});
                if(parent.lastChild&&parent.lastChild.nodeName!=='BR')parent.appendChild(document.createElement('br'));
                return;
            }
            if(!SAFE_RICH_TAGS[tag]){
                Array.prototype.forEach.call(node.childNodes,function(child){appendNode(child,parent)});
                return;
            }
            var clean=document.createElement(tag.toLowerCase());
            if(tag==='EM'||tag==='I'){
                if(node.classList.contains('accent--rasp'))clean.className='accent--rasp';
                if(node.classList.contains('accent--teal'))clean.className='accent--teal';
            }
            Array.prototype.forEach.call(node.childNodes,function(child){appendNode(child,clean)});
            parent.appendChild(clean);
        }

        Array.prototype.forEach.call(source.content.childNodes,function(node){appendNode(node,fragment)});
        while(element.firstChild)element.removeChild(element.firstChild);
        element.appendChild(fragment);
    }

    function setEditableText(element,value,key){
        if(!element)return;
        var text=normalizeEditableText(value).trim();
        var i18n=window.QH&&window.QH.i18n;
        if(i18n&&i18n.language&&i18n.language()!=='es'&&i18n.cmsText){
            text=i18n.cmsText(key,text)||text;
        }
        element.textContent=text;
    }

    var qh=window.QH||{};
    qh.sb=sb;
    qh.updateCartCount=updateCartCount;
    qh.normalizeEditableText=normalizeEditableText;
    qh.renderEditableRichText=renderEditableRichText;
    qh.setEditableText=setEditableText;
    window.QH=qh;

    function tr(key,fallback,params){
        return qh.i18n&&qh.i18n.t?qh.i18n.t(key,params):(fallback||key);
    }

    function languageSwitcher(){
        return qh.i18n&&qh.i18n.switcher?qh.i18n.switcher():'';
    }

    var NAV_LINKS=[
        {key:'nav.shop',label:'Tienda',href:'tienda.html'},
        {key:'nav.membership',label:'Membresía',href:'membresia.html'},
        {key:'nav.distribute',label:'Distribuye Queens',href:'distribuye-queens.html'}
    ];
    var NAV_MORE=[
        {key:'nav.events',label:'Eventos',href:'eventos.html'},
        {key:'nav.about',label:'Nosotros',href:'nosotros.html'},
        {key:'nav.services',label:'Servicios',href:'servicios.html'},
        {key:'nav.faqs',label:'FAQs',href:'faqs.html'}
    ];
    var EXPLORE_LINKS=[
        {key:'nav.shop',label:'Tienda',href:'tienda.html'},
        {key:'nav.membership',label:'Membresía',href:'membresia.html'},
        {key:'nav.distribute',label:'Distribuye Queens',href:'distribuye-queens.html'},
        {key:'nav.events',label:'Eventos',href:'eventos.html'},
        {key:'nav.about',label:'Nosotros',href:'nosotros.html'},
        {key:'nav.services',label:'Servicios',href:'servicios.html'},
        {key:'nav.faqs',label:'FAQs',href:'faqs.html'}
    ];
    var LEGAL_LINKS=[
        {key:'legal.terms',label:'Términos y Condiciones',href:'terminos.html'},
        {key:'legal.shipping',label:'Políticas de Envío',href:'politicas-envio.html'},
        {key:'legal.privacy',label:'Aviso de Privacidad',href:'aviso-privacidad.html'},
        {key:'legal.returns',label:'Devoluciones',href:'devoluciones.html'}
    ];
    var SOCIALS=[
        {label:'Instagram',url:'https://instagram.com/queenshidro',path:'<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>'},
        {label:'Facebook',url:'https://www.facebook.com/Queenshidro/',path:'<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'}
    ];

    var body=document.body;
    if(!body)return;
    var navMode=body.getAttribute('data-nav')||'full';
    var hasCart=body.getAttribute('data-cart')==='true';
    var hasFoot=body.getAttribute('data-foot')!=='false';
    var active=body.getAttribute('data-active')||'';

    function svgIcon(path){return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';}

    function buildNav(){
        var logo='<a href="index.html" class="nav__logo" aria-label="Queens Hidro"><img src="logo2.webp" alt="Queens Hidro" width="1155" height="404"></a>';
        var burger='<button class="nav__burger" aria-label="'+tr('nav.menu','Menú')+'"><span></span><span></span><span></span></button>';
        if(navMode==='back'){
            return '<nav class="nav"><div class="container"><div class="nav__left">'+logo+'</div><a href="tienda.html" class="nav__back"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>'+tr('nav.backShop','Volver a la tienda')+'</a><div class="nav__right">'+languageSwitcher()+'</div></div></nav>';
        }
        var links=NAV_LINKS.map(function(l){
            var cls=l.href.replace('.html','')===active?' class="nav__active"':'';
            return '<a href="'+l.href+'"'+cls+'>'+tr(l.key,l.label)+'</a>';
        }).join('');
        var more=NAV_MORE.map(function(l){return '<a href="'+l.href+'">'+tr(l.key,l.label)+'</a>';}).join('');
        var cart=hasCart
            ? '<button class="nav__cart" id="navCartBtn" aria-label="'+tr('nav.cart','Carrito')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span class="nav__cart-count" id="cartCount" style="display:none">0</span></button>'
            : '';
        var user='<div class="nav__user" id="navUser"><button class="nav__avatar" id="userAvatar"></button><div class="nav__dropdown" id="userDropdown"><a href="cuenta.html">'+tr('nav.account','Mi cuenta')+'</a><button class="nav__logout" id="navLogoutBtn">'+tr('nav.logout','Cerrar sesión')+'</button></div></div>';
        return '<nav class="nav"><div class="container">'+logo+burger+
            '<div class="nav__links">'+links+
                '<div class="nav__more"><span class="nav__more-label">'+tr('nav.more','Más')+' <i class="bi bi-chevron-down"></i></span><div class="nav__more-items">'+more+'</div></div>'+ 
                '<a href="membresia.html" class="nav__cta">'+tr('nav.login','Entrar')+'</a>'+ 
            '</div>'+ 
            '<div class="nav__right">'+languageSwitcher()+cart+user+'</div>'+ 
        '</div></nav>';
    }

    function buildFoot(){
        var socials=SOCIALS.map(function(s){
            return '<a href="'+s.url+'" class="foot__soc" aria-label="'+s.label+'" target="_blank" rel="noopener">'+svgIcon(s.path)+'</a>';
        }).join('');
        var legal=LEGAL_LINKS.map(function(l){return '<li><a href="'+l.href+'">'+tr(l.key,l.label)+'</a></li>';}).join('');
        var explore=EXPLORE_LINKS.map(function(l){return '<li><a href="'+l.href+'">'+tr(l.key,l.label)+'</a></li>';}).join('');
        return '<footer class="foot"><div class="container">'+
            '<div class="foot__grid">'+
            '<div><p class="foot__brand">Queens Hidro</p><p class="foot__desc" id="footerDesc">Hidromiel artesanal de fruta real y miel mexicana. Cada botella apoya a los apicultores de Nuevo León.</p></div>'+ 
            '<div class="foot__col"><p class="foot__col-title">'+tr('footer.legal','Legal')+'</p><ul>'+legal+'</ul></div>'+ 
            '<div class="foot__col"><p class="foot__col-title">'+tr('footer.explore','Explora')+'</p><ul>'+explore+'</ul></div>'+ 
            '<div class="foot__col"><p class="foot__col-title">'+tr('footer.follow','Síguenos')+'</p><div class="foot__socials">'+socials+'</div></div>'+ 
            '</div>'+ 
            '<div class="foot__bot"><span>&copy; 2026 Queens Hidro. '+tr('footer.rights','Todos los derechos reservados.')+'</span>'+ 
            '<div class="foot__age"><span class="foot__age-badge">+18</span>'+tr('footer.age','Prohibida la venta a menores de 18 años. Consume con responsabilidad.')+'</div></div>'+ 
        '</div></footer>';
    }

    function updateCartCount(){
        var el=document.getElementById('cartCount');
        if(!el)return;
        try{
            var cart=JSON.parse(localStorage.getItem('qh_cart'))||{items:[]};
            var count=cart.items.reduce(function(s,i){return s+(i.quantity||0);},0);
            if(count>0){el.style.display='flex';el.textContent=count;}
            else{el.style.display='none';}
        }catch(e){}
    }

    var COVER_DEFAULTS={
        'tienda':{key:'img_tienda_cover',def:'HERO/HERO4.webp'},
        'membresia':{key:'img_membresia_cover',def:'HERO/HERO2.webp'},
        'distribuye-queens':{key:'img_distribuye_hero_image',def:'HERO/HERO1.webp'}
    };
    function initCoverHero(){
        var img=document.querySelector('.cover-hero__bg');
        if(!img)return;
        var cfg=COVER_DEFAULTS[body.getAttribute('data-active')||''];
        if(!cfg){img.src=img.getAttribute('src')||'';return;}
        function fallback(){img.onerror=null;img.src=cfg.def;}
        img.onerror=fallback;
        if(!sb){fallback();return;}
        sb.from('site_content').select('value').eq('key',cfg.key).single().then(function(r){
            var v=r.data&&r.data.value;
            if(v&&v!=='undefined'&&/^(https?:\/\/|data:image\/|\.?\.?\/)/.test(v))img.src=v;
            else fallback();
        }).catch(fallback);
    }

    function initChrome(){
        if(navMode!=='none') document.body.insertAdjacentHTML('afterbegin',buildNav());
        if(hasFoot) document.body.insertAdjacentHTML('beforeend',buildFoot());

        var b=document.querySelector('.nav__burger'),l=document.querySelector('.nav__links');
        if(b&&l){
            b.addEventListener('click',function(){
                var o=l.classList.toggle('open');
                b.classList.toggle('open',o);
                b.setAttribute('aria-expanded',o?'true':'false');
            });
            l.addEventListener('click',function(e){
                if(e.target.closest('.nav__links a')){
                    l.classList.remove('open');b.classList.remove('open');
                    b.setAttribute('aria-expanded','false');
                }
            });
        }

        if(hasCart){
            updateCartCount();
            window.addEventListener('storage',updateCartCount);
            window.addEventListener('qh:cart:change',updateCartCount);
        }

        if(body.hasAttribute('data-hero')){
            var navEl=document.querySelector('.nav');
            if(navEl){
                function onScroll(){
                    navEl.classList.toggle('nav--scrolled',window.scrollY>30);
                }
                window.addEventListener('scroll',onScroll,{passive:true});
                onScroll();
            }
        }

        initCoverHero();

        if(sb){
            var nv=document.getElementById('navUser'),av=document.getElementById('userAvatar'),dd=document.getElementById('userDropdown');
            var logoutBtn=document.getElementById('navLogoutBtn');
            function setCta(show){
                var cta=document.querySelector('.nav__cta');
                if(cta)cta.style.display=show?'':'none';
            }
            if(av&&nv){
                av.addEventListener('click',function(e){e.stopPropagation();dd.classList.toggle('show');});
                document.addEventListener('click',function(){dd.classList.remove('show');});
                sb.auth.getSession().then(function(r){
                    if(r.data.session&&r.data.session.user){
                        var u=r.data.session.user;
                        var n=(u.user_metadata&&u.user_metadata.full_name)||u.email.split('@')[0];
                        nv.style.display='block';av.textContent=n.charAt(0).toUpperCase();av.title=n;
                        setCta(false);
                    }else{
                        setCta(true);
                    }
                });
                sb.auth.onAuthStateChange(function(e,s){
                    if(e==='SIGNED_IN'&&s){
                        var n=(s.user.user_metadata&&s.user.user_metadata.full_name)||s.user.email.split('@')[0];
                        nv.style.display='block';av.textContent=n.charAt(0).toUpperCase();av.title=n;
                        setCta(false);
                    }else if(e==='SIGNED_OUT'){
                        nv.style.display='none';
                        setCta(true);
                    }
                });
                if(logoutBtn){
                    logoutBtn.addEventListener('click',async function(){
                        await sb.auth.signOut();
                        window.location.href='index.html';
                    });
                }
            }
            sb.from('site_content').select('*').eq('section','footer').then(function(r){
                if(!r.data)return;
                var m={};r.data.forEach(function(c){m[c.key]=c.value;});
                var el=document.getElementById('footerDesc');
                if(el&&(m.footer_desc_long||m.footer_desc_short)){
                    setEditableText(el,m.footer_desc_long||m.footer_desc_short,m.footer_desc_long?'footer_desc_long':'footer_desc_short');
                }
            });
        }
    }

    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',initChrome);
    }else{
        initChrome();
    }
})();
