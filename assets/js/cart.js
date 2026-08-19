/* ============================================================
   QUEENS HIDRO — Módulo de carrito compartido
   Persistencia local + sincronización con Supabase (usuarios),
   validación de precios/stock contra la BD, límites y eventos.
   Uso: window.QH.cart
   ============================================================ */
(function(){
    var CART_KEY='qh_cart';
    var MAX_AGE_DAYS=30;
    var SYNC_DEBOUNCE_MS=900;

    var state={
        items:[],
        savedAt:0,
        settings:null,
        subscriber:false,
        notices:[],
        lastRemoved:null,
        syncTimer:null,
        initStarted:false
    };

    function sb(){ return window.QH&&window.QH.sb; }

    /* ---------- helpers ---------- */
    function clampQty(qty){
        var max=getSettings().maxQty;
        return Math.max(1,Math.min(max,Math.floor(qty)||1));
    }
    function money(n){ return Math.round((n+Number.EPSILON)*100)/100; }
    function getSettings(){
        var s=state.settings||{};
        return {
            shippingFlat:Math.max(0,parseFloat(s.shippingFlat)||199),
            shippingFlatSubscriber:Math.max(0,parseFloat(s.shippingFlatSubscriber)||150),
            deliveryEstimate:s.deliveryEstimate||'2 a 5 días hábiles',
            maxQty:Math.max(1,parseInt(s.maxQty,10)||12)
        };
    }
    function findItem(id){
        for(var i=0;i<state.items.length;i++){
            if(String(state.items[i].id)===String(id)) return state.items[i];
        }
        return null;
    }
    function fmt(n){
        var locale=window.QH&&window.QH.i18n?window.QH.i18n.locale():'es-MX';
        return '$'+money(n).toLocaleString(locale,{minimumFractionDigits:2,maximumFractionDigits:2});
    }

    function tr(key,fallback,params){
        return window.QH&&window.QH.i18n&&window.QH.i18n.t
            ? window.QH.i18n.t(key,params)
            : (fallback||key);
    }

    /* ---------- persistencia local ---------- */
    function loadLocal(){
        try{
            var c=JSON.parse(localStorage.getItem(CART_KEY));
            if(!c||!Array.isArray(c.items)) return;
            var age=(Date.now()-(c.savedAt||0))/86400000;
            if(age>MAX_AGE_DAYS){ localStorage.removeItem(CART_KEY); return; }
            state.items=c.items.filter(function(i){return i&&i.id&&i.quantity>0;});
            state.savedAt=c.savedAt||Date.now();
        }catch(e){ state.items=[]; }
    }
    function persist(){
        state.savedAt=Date.now();
        try{ localStorage.setItem(CART_KEY,JSON.stringify({items:state.items,savedAt:state.savedAt})); }
        catch(e){ /* cuota llena: ignora */ }
        emit();
        scheduleSync();
    }
    function emit(){
        window.dispatchEvent(new CustomEvent('qh:cart:change',{detail:{count:count()}}));
    }

    /* ---------- API pública ---------- */
    function items(){ return state.items; }
    function count(){
        return state.items.reduce(function(s,i){return s+(i.quantity||0);},0);
    }
    function subtotal(){
        return money(state.items.reduce(function(s,i){return s+((i.price||0)*(i.quantity||0));},0));
    }
    function shippingFee(){
        var s=getSettings();
        return money(state.subscriber?s.shippingFlatSubscriber:s.shippingFlat);
    }
    function total(){ return money(subtotal()+shippingFee()); }
    function settings(){ return getSettings(); }
    function isSubscriber(){ return !!state.subscriber; }

    function add(product, qty){
        if(!product||!product.id) return {ok:false,notice:tr('common.productInvalid','Producto inválido')};
        var n=Math.max(1,Math.floor(qty)||1);
        var max=getSettings().maxQty;
        var cur=findItem(product.id);
        var notice=null;
        if(cur){
            if(cur.quantity+n>max){
                notice=tr('common.maxProduct','Máximo {value} por producto',{value:max});
                n=max-cur.quantity;
            }
            if(n<=0){ emit(); return {ok:false,notice:notice||tr('common.maxReached','Cantidad máxima alcanzada')}; }
            cur.quantity+=n;
        }else{
            n=Math.min(n,max);
            state.items.push({
                id:product.id,
                name:product.name||'Producto',
                price:money(Number(product.price)||0),
                image_url:product.image_url||'',
                alcohol_percent:product.alcohol_percent,
                volume_ml:product.volume_ml,
                sweetness:product.sweetness,
                quantity:n
            });
        }
        persist();
        return {ok:true,notice:notice,quantity:cur?cur.quantity:n};
    }

    function setQty(id, qty){
        var item=findItem(id);
        if(!item) return false;
        var n=Math.floor(qty);
        var max=getSettings().maxQty;
        if(n<1) return remove(id);
        item.quantity=Math.min(n,max);
        if(max>0&&n>max){ state.notices.push(tr('common.maxProduct','Máximo {value} por producto',{value:max})); }
        persist();
        return true;
    }

    function remove(id){
        var idx=-1;
        for(var i=0;i<state.items.length;i++){
            if(String(state.items[i].id)===String(id)){ idx=i; break; }
        }
        if(idx<0) return false;
        state.lastRemoved={item:state.items[idx],at:Date.now()};
        state.items.splice(idx,1);
        persist();
        return true;
    }

    function restoreLastRemoved(){
        if(!state.lastRemoved) return false;
        var lr=state.lastRemoved;
        state.lastRemoved=null;
        if(Date.now()-lr.at>15000) return false;
        var item=findItem(lr.item.id);
        if(item){ item.quantity=Math.min(getSettings().maxQty,item.quantity+lr.item.quantity); }
        else{ state.items.push(lr.item); }
        persist();
        return true;
    }

    function clear(){
        state.items=[];
        state.lastRemoved=null;
        persist();
    }
    function reload(){
        loadLocal();
        refreshSettings();
        emit();
    }

    /* ---------- noticias para el usuario ---------- */
    function consumeNotices(){
        var n=state.notices.slice();
        state.notices=[];
        return n;
    }
    function pushNotice(msg){ state.notices.push(msg); }

    /* ---------- configuración desde site_content ---------- */
    function refreshSettings(){
        var client=sb();
        if(!client) return Promise.resolve();
        return client.from('site_content').select('key,value').eq('section','tienda')
            .then(function(r){
                var m={};
                (r.data||[]).forEach(function(c){ if(c.key) m[c.key]=c.value; });
                state.settings={
                    shippingFlat:m.shipping_flat,
                    shippingFlatSubscriber:m.shipping_flat_subscriber,
                    deliveryEstimate:m.delivery_estimate,
                    maxQty:m.max_qty_per_product
                };
                return state.settings;
            }).catch(function(){});
    }

    /* ---------- estado de suscripción (envío preferencial) ---------- */
    function refreshSubscription(){
        var client=sb();
        if(!client) return Promise.resolve();
        return client.auth.getSession().then(function(r){
            var user=r.data.session&&r.data.session.user;
            if(!user){
                state.subscriber=false;
                emit();
                return state.subscriber;
            }
            return client.from('subscriptions')
                .select('id').eq('user_id',user.id).eq('status','active').limit(1).maybeSingle()
                .then(function(res){
                    state.subscriber=!!(res.data&&res.data.id);
                    emit();
                    return state.subscriber;
                }).catch(function(){ state.subscriber=false; emit(); return false; });
        }).catch(function(){});
    }

    /* ---------- validación contra la BD (precios/stock/disponibilidad) ---------- */
    function validate(){
        var client=sb();
        if(!client||!state.items.length) return Promise.resolve([]);
        var ids=state.items.map(function(i){return i.id;});
        return client.from('products').select('id,name,price,active,stock,image_url')
            .in('id',ids)
            .then(function(r){
                var map={};
                (r.data||[]).forEach(function(p){ map[String(p.id)]=p; });
                var changed=false;
                state.items=state.items.filter(function(item){
                    var p=map[String(item.id)];
                    if(!p||p.active===false){
                        pushNotice(tr('common.unavailableRemoved','{name} ya no está disponible y se quitó de tu carrito',{name:item.name}));
                        changed=true;
                        return false;
                    }
                    if(item.name!==p.name){ item.name=p.name||item.name||'Producto'; changed=true; }
                    item.stock=(p.stock!==null&&p.stock!==undefined)?Number(p.stock):null;
                    var newPrice=money(Number(p.price)||0);
                    if(item.price!==undefined&&item.price!==newPrice){
                        pushNotice(tr('common.priceUpdated','El precio de {name} se actualizó ({price})',{name:p.name,price:fmt(newPrice)}));
                        changed=true;
                    }
                    if(item.price===undefined||item.price!==newPrice) item.price=newPrice;
                    var max=getSettings().maxQty;
                    if(item.quantity>max){
                        item.quantity=max;
                        pushNotice(tr('common.maxNamed','Máximo {value} de {name} por pedido',{value:max,name:p.name}));
                        changed=true;
                    }
                    if(item.stock!==null){
                        if(item.quantity>item.stock){
                            item.quantity=Math.max(1,item.stock);
                            if(item.stock<=0){
                                pushNotice(tr('common.soldOutRemoved','{name} se agotó y se quitó de tu carrito',{name:p.name}));
                                changed=true;
                                return false;
                            }
                            pushNotice(tr('common.availableOnly','Solo quedan {value} de {name}, ajustamos la cantidad',{value:item.stock,name:p.name}));
                            changed=true;
                        }
                    }
                    if(p.image_url&&p.image_url!==item.image_url){ item.image_url=p.image_url; changed=true; }
                    return true;
                });
                if(changed) persist();
                return consumeNotices();
            })
            .catch(function(){ return []; });
    }

    /* ---------- sincronización con Supabase (usuarios logueados) ---------- */
    function scheduleSync(){
        if(state.syncTimer) clearTimeout(state.syncTimer);
        state.syncTimer=setTimeout(pushServer,SYNC_DEBOUNCE_MS);
    }
    function pushServer(){
        var client=sb();
        if(!client) return;
        client.auth.getSession().then(function(r){
            var user=r.data.session&&r.data.session.user;
            if(!user) return;
            var payload=state.items.map(function(i){
                return {id:i.id,quantity:i.quantity};
            });
            client.from('carts').upsert({user_id:user.id,items:payload,updated_at:new Date().toISOString()})
                .then(function(res){
                    if(res.error) console.warn('cart sync:',res.error.message);
                });
        });
    }
    function mergeServerItems(remoteItems){
        var map={};
        state.items.forEach(function(i){ map[String(i.id)]=i; });
        (remoteItems||[]).forEach(function(ri){
            var local=map[String(ri.id)];
            if(local){
                var max=getSettings().maxQty;
                local.quantity=Math.min(max,local.quantity+(Number(ri.quantity)||0));
            }else{
                state.items.push({id:ri.id,quantity:Math.min(getSettings().maxQty,Number(ri.quantity)||1)});
            }
        });
    }
    function pullServer(){
        var client=sb();
        if(!client) return Promise.resolve();
        return client.auth.getSession().then(function(r){
            var user=r.data.session&&r.data.session.user;
            if(!user) return;
            return client.from('carts').select('items').eq('user_id',user.id).maybeSingle()
                .then(function(res){
                    var remote=res.data&&Array.isArray(res.data.items)?res.data.items:null;
                    if(!remote) return;
                    if(!state.items.length){
                        state.items=remote.map(function(ri){ return {id:ri.id,quantity:Math.min(getSettings().maxQty,Number(ri.quantity)||1)}; });
                        persist();
                    }else{
                        mergeServerItems(remote);
                        persist();
                    }
                    // re-validar precios/nombres de los items traídos del servidor
                    if(state.items.length) validate();
                });
        }).catch(function(){});
    }

    /* ---------- init ---------- */
    function init(){
        if(state.initStarted) return;
        state.initStarted=true;
        loadLocal();
        refreshSettings();
        refreshSubscription();
        var client=sb();
        if(client){
            client.auth.onAuthStateChange(function(event){
                if(event==='SIGNED_IN'){ refreshSubscription(); pullServer(); }
                else if(event==='SIGNED_OUT'){ refreshSubscription(); }
            });
            pullServer();
        }
        window.addEventListener('storage',function(e){
            if(e.key===CART_KEY){ loadLocal(); emit(); }
        });
        // el badge del nav se actualiza vía evento
        emit();
        return validate();
    }

    window.QH.cart={
        init:init,
        items:items,
        count:count,
        subtotal:subtotal,
        shippingFee:shippingFee,
        total:total,
        settings:settings,
        isSubscriber:isSubscriber,
        fmt:fmt,
        add:add,
        setQty:setQty,
        remove:remove,
        restoreLastRemoved:restoreLastRemoved,
        clear:clear,
        reload:reload,
        validate:validate,
        consumeNotices:consumeNotices,
        pushNotice:pushNotice,
        refreshSettings:refreshSettings,
        refreshSubscription:refreshSubscription
    };
})();
