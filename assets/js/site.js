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
    window.QH={ sb:sb, updateCartCount:updateCartCount };

    var NAV_LINKS=[
        {label:'Tienda',href:'tienda.html'},
        {label:'Membresía',href:'membresia.html'},
        {label:'Distribuye Queens',href:'distribuye-queens.html'}
    ];
    var NAV_MORE=[
        {label:'Eventos',href:'eventos.html'},
        {label:'Nosotros',href:'nosotros.html'},
        {label:'Servicios',href:'servicios.html'},
        {label:'FAQs',href:'faqs.html'}
    ];
    var EXPLORE_LINKS=[
        {label:'Tienda',href:'tienda.html'},
        {label:'Membresía',href:'membresia.html'},
        {label:'Distribuye Queens',href:'distribuye-queens.html'},
        {label:'Eventos',href:'eventos.html'},
        {label:'Nosotros',href:'nosotros.html'},
        {label:'Servicios',href:'servicios.html'},
        {label:'FAQs',href:'faqs.html'}
    ];
    var LEGAL_LINKS=[
        {label:'Términos y Condiciones',href:'#'},
        {label:'Políticas de Envío',href:'#'},
        {label:'Aviso de Privacidad',href:'#'},
        {label:'Devoluciones',href:'#'}
    ];
    var SOCIALS=[
        {label:'Instagram',path:'<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>'},
        {label:'TikTok',path:'<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>'},
        {label:'Spotify',path:'<circle cx="12" cy="12" r="10"/><path d="M8 11.5c3-1 7-1 10 0M9 14.5c2.5-.8 5.5-.8 8 0M10 17.5c2-.6 4-.6 6 0"/>'},
        {label:'YouTube',path:'<polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/><path d="M21.54 7.1a2.52 2.52 0 0 0-1.78-1.78C18.2 4.89 12 4.89 12 4.89s-6.2 0-7.76.43A2.52 2.52 0 0 0 2.46 7.1C2 8.66 2 11.75 2 11.75s0 3.09.46 4.65a2.52 2.52 0 0 0 1.78 1.78c1.56.43 7.76.43 7.76.43s6.2 0 7.76-.43a2.52 2.52 0 0 0 1.78-1.78c.46-1.56.46-4.65.46-4.65s0-3.09-.46-4.65z"/>'}
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
        var burger='<button class="nav__burger" aria-label="Menú"><span></span><span></span><span></span></button>';
        if(navMode==='back'){
            return '<nav class="nav"><div class="container"><div class="nav__left">'+logo+'</div><a href="tienda.html" class="nav__back"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Volver a la tienda</a></div></nav>';
        }
        var links=NAV_LINKS.map(function(l){
            var cls=l.href.replace('.html','')===active?' class="nav__active"':'';
            return '<a href="'+l.href+'"'+cls+'>'+l.label+'</a>';
        }).join('');
        var more=NAV_MORE.map(function(l){return '<a href="'+l.href+'">'+l.label+'</a>';}).join('');
        var cart=hasCart
            ? '<button class="nav__cart" id="navCartBtn" aria-label="Carrito"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span class="nav__cart-count" id="cartCount" style="display:none">0</span></button>'
            : '';
        var user='<div class="nav__user" id="navUser"><button class="nav__avatar" id="userAvatar"></button><div class="nav__dropdown" id="userDropdown"><a href="cuenta.html">Mi cuenta</a><button class="nav__logout" id="navLogoutBtn">Cerrar sesión</button></div></div>';
        return '<nav class="nav"><div class="container">'+logo+burger+
            '<div class="nav__links">'+links+
                '<span class="nav__more">Más <i class="bi bi-chevron-down"></i><div class="nav__more-items">'+more+'</div></span>'+
                '<a href="membresia.html" class="nav__cta">Entrar</a>'+
            '</div>'+
            '<div class="nav__right">'+cart+user+'</div>'+
        '</div></nav>';
    }

    function buildFoot(){
        var socials=SOCIALS.map(function(s){
            return '<a href="#" class="foot__soc" aria-label="'+s.label+'">'+svgIcon(s.path)+'</a>';
        }).join('');
        var legal=LEGAL_LINKS.map(function(l){return '<li><a href="'+l.href+'">'+l.label+'</a></li>';}).join('');
        var explore=EXPLORE_LINKS.map(function(l){return '<li><a href="'+l.href+'">'+l.label+'</a></li>';}).join('');
        return '<footer class="foot"><div class="container">'+
            '<div class="foot__grid">'+
                '<div><p class="foot__brand">Queens Hidro</p><p class="foot__desc" id="footerDesc">Hidromiel artesanal de fruta real y miel mexicana. Cada botella apoya a los apicultores de Nuevo León.</p></div>'+
                '<div class="foot__col"><p class="foot__col-title">Legal</p><ul>'+legal+'</ul></div>'+
                '<div class="foot__col"><p class="foot__col-title">Explora</p><ul>'+explore+'</ul></div>'+
                '<div class="foot__col"><p class="foot__col-title">Síguenos</p><div class="foot__socials">'+socials+'</div></div>'+
            '</div>'+
            '<div class="foot__bot"><span>&copy; 2026 Queens Hidro. Todos los derechos reservados.</span>'+
            '<div class="foot__age"><span class="foot__age-badge">+18</span>Prohibida la venta a menores de 18 años. Consume con responsabilidad.</div></div>'+
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
                if(e.target.closest('.nav__links>a')||e.target.closest('.nav__cta')){
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
                    el.textContent=m.footer_desc_long||m.footer_desc_short;
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
