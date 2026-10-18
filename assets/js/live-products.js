(() => {
  const URL='https://jkwhnahxkmqzplgvpbre.supabase.co';
  const KEY='sb_publishable_tHga70SJR6CGFz3VPBcfWg_UtY_bfai';
  const root=document.getElementById('live-product-grid');
  if(!root || !window.supabase)return;
  const db=window.supabase.createClient(URL,KEY);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=p=>p.price===null||p.price===undefined?'Price on request':esc(p.currency)+' '+Number(p.price).toLocaleString();
  let products=[];
  const controls={
    q:document.getElementById('listing-search'),
    category:document.getElementById('listing-filter-category'),
    type:document.getElementById('listing-filter-type'),
    location:document.getElementById('listing-filter-location'),
    min:document.getElementById('listing-filter-min'),
    max:document.getElementById('listing-filter-max')
  };
  function render(){
    const q=(controls.q?.value||'').trim().toLowerCase();
    const category=controls.category?.value||'';
    const type=controls.type?.value||'';
    const location=(controls.location?.value||'').trim().toLowerCase();
    const min=controls.min?.value===''?null:Number(controls.min?.value);
    const max=controls.max?.value===''?null:Number(controls.max?.value);
    const data=products.filter(p=>{
      const hay=[p.title,p.category,p.description,p.location,p.listing_type].join(' ').toLowerCase();
      return (!q||hay.includes(q))&&(!category||p.category===category)&&(!type||p.listing_type===type)&&(!location||String(p.location||'').toLowerCase().includes(location))&&(min===null||p.price!==null&&Number(p.price)>=min)&&(max===null||p.price!==null&&Number(p.price)<=max);
    });
    const count=document.getElementById('listing-result-count');
    if(count)count.textContent=data.length+' listing'+(data.length===1?'':'s')+' found';
    if(!data.length){root.innerHTML='<p class="live-products-empty">No listings match those filters. Try changing your search or contact iBAGENCY for current options.</p>';return;}
    root.innerHTML=data.map(p=>{
      const images=Array.isArray(p.image_urls)?p.image_urls.filter(Boolean):[];
      const galleryId='product-gallery-'+String(p.id).replace(/[^a-zA-Z0-9_-]/g,'');
      const photoGallery=images.length
        ? '<div class="live-product-gallery"><div class="live-product-carousel" id="'+esc(galleryId)+'" role="region" aria-label="Photos of '+esc(p.title)+'">'+images.map((url,i)=>'<div class="live-product-slide"><img class="live-product-photo" src="'+esc(url)+'" alt="'+esc(p.title)+' — photo '+(i+1)+' of '+images.length+'" loading="'+(i===0?'eager':'lazy')+'"></div>').join('')+'</div>'+(images.length>1?'<div class="live-product-gallery-meta"><span>Swipe to view photos</span><span class="live-product-counter" aria-live="polite">1 / '+images.length+'</span></div>':'')+'</div>'
        : '<div class="live-product-placeholder">iBAGENCY</div>';
      const text=encodeURIComponent('Hello iBAGENCY, I am interested in: '+p.title+' ('+p.category+', '+(p.listing_type||'For Sale')+'). Please share current details.');
      return '<article class="live-product-card">'+photoGallery+'<div class="live-product-content"><div class="live-product-badges"><span class="live-product-category">'+esc(p.category)+'</span><span class="live-product-type">'+esc(p.listing_type||'For Sale')+'</span></div><h3>'+esc(p.title)+'</h3><p class="live-product-location">⌖ '+esc(p.location)+'</p><p class="live-product-price">'+money(p)+'</p><p class="live-product-description">'+esc(p.description||'Contact us for more details.')+'</p><a class="live-product-cta" href="https://wa.me/2349118045889?text='+text+'" target="_blank" rel="noopener noreferrer">Request details on WhatsApp ↗</a></div></article>';
    }).join('');
    root.querySelectorAll('.live-product-carousel').forEach(carousel=>{
      const counter=carousel.parentElement.querySelector('.live-product-counter'),total=carousel.children.length;
      carousel.addEventListener('scroll',()=>{const width=carousel.clientWidth;if(!width||!counter)return;counter.textContent=Math.min(total,Math.max(1,Math.round(carousel.scrollLeft/width)+1))+' / '+total;},{passive:true});
    });
  }
  Object.values(controls).filter(Boolean).forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',render));
  document.getElementById('listing-filter-reset')?.addEventListener('click',()=>{Object.values(controls).filter(Boolean).forEach(el=>el.value='');render();});
  db.from('ibagency_products').select('id,title,category,listing_type,description,price,currency,location,image_urls,created_at').eq('status','published').order('created_at',{ascending:false}).then(({data,error})=>{
    if(error){root.innerHTML='<p class="live-products-empty">Live listings are being configured. Please contact us for current availability.</p>';return;}
    products=data||[];render();
    if(!products.length)root.innerHTML='<p class="live-products-empty">No products have been published yet. Contact iBAGENCY to request current options.</p>';
  });
})();