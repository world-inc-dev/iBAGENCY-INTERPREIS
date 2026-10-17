(() => {
  const URL='https://jkwhnahxkmqzplgvpbre.supabase.co';
  const KEY='sb_publishable_tHga70SJR6CGFz3VPBcfWg_UtY_bfai';
  const root=document.getElementById('live-product-grid');
  if(!root || !window.supabase)return;
  const db=window.supabase.createClient(URL,KEY);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=p=>p.price===null||p.price===undefined?'Price on request':esc(p.currency)+' '+Number(p.price).toLocaleString();
  db.from('ibagency_products').select('id,title,category,description,price,currency,location,image_urls,created_at').eq('status','published').order('created_at',{ascending:false}).then(({data,error})=>{
    if(error){root.innerHTML='<p class="live-products-empty">Live listings are being configured. Please contact us for current availability.</p>';return;}
    if(!data||!data.length){root.innerHTML='<p class="live-products-empty">No products have been published yet. Contact iBAGENCY to request current options.</p>';return;}
    root.innerHTML=data.map(p=>{
      const images=Array.isArray(p.image_urls)?p.image_urls.filter(Boolean):[];
      const img=images[0]||'';
      const photoGallery=img
        ? '<div class="live-product-gallery"><img class="live-product-photo" id="product-photo-'+esc(p.id)+'" src="'+esc(img)+'" alt="'+esc(p.title)+'" loading="lazy">'+(images.length>1?'<div class="live-product-thumbnails" aria-label="More photos of '+esc(p.title)+'">'+images.map((url,i)=>'<button type="button" class="live-product-thumb'+(i===0?' is-active':'')+'" data-product-id="'+esc(p.id)+'" data-photo-url="'+esc(url)+'" aria-label="View photo '+(i+1)+' of '+images.length+'"><img src="'+esc(url)+'" alt="" loading="lazy"></button>').join('')+'</div>':'')+'</div>'
        : '<div class="live-product-placeholder">iBAGENCY</div>';
      const text=encodeURIComponent('Hello iBAGENCY, I am interested in: '+p.title+' ('+p.category+'). Please share current details.');
      return '<article class="live-product-card">'+photoGallery+'<div class="live-product-content"><span class="live-product-category">'+esc(p.category)+'</span><h3>'+esc(p.title)+'</h3><p class="live-product-location">⌖ '+esc(p.location)+'</p><p class="live-product-price">'+money(p)+'</p><p class="live-product-description">'+esc(p.description||'Contact us for more details.')+'</p><a class="live-product-cta" href="https://wa.me/2349118045889?text='+text+'" target="_blank" rel="noopener noreferrer">Request details on WhatsApp ↗</a></div></article>';
    }).join('');
    root.querySelectorAll('.live-product-thumb').forEach(button=>button.addEventListener('click',()=>{
      const photo=document.getElementById('product-photo-'+button.dataset.productId);
      if(photo) photo.src=button.dataset.photoUrl;
      const gallery=button.closest('.live-product-gallery');
      if(gallery) gallery.querySelectorAll('.live-product-thumb').forEach(item=>item.classList.toggle('is-active',item===button));
    }));
  });
})();