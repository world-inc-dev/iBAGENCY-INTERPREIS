(() => {
  const SUPABASE_URL = 'https://jkwhnahxkmqzplgvpbre.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_tHga70SJR6CGFz3VPBcfWg_UtY_bfai';
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const $ = id => document.getElementById(id);
  const loginPanel = $('login-panel'), workspace = $('workspace'), message = $('admin-message');
  let user = null, currentImages = [];

  function say(text, error=false) { message.textContent = text; message.classList.toggle('error', error); }
  function sayLogin(text, error=false) {
    const box = $('login-message');
    if (box) { box.textContent = text; box.classList.toggle('error', error); }
  }
  function escapeHtml(value='') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function resetForm() {
    $('product-form').reset(); $('product-id').value = ''; currentImages = [];
    $('form-heading').textContent = 'Add a product'; $('save-product').textContent = 'Save product';
    renderExistingImages();
  }
  function renderExistingImages() {
    $('existing-images').innerHTML = currentImages.map((url,i)=>'<span class="existing-image"><img src="'+escapeHtml(url)+'" alt="Saved product photo"><button type="button" data-remove-image="'+i+'" aria-label="Remove photo">×</button></span>').join('');
    $('existing-images').querySelectorAll('[data-remove-image]').forEach(b=>b.addEventListener('click',()=>{currentImages.splice(Number(b.dataset.removeImage),1);renderExistingImages();}));
  }
  async function uploadSelectedFiles() {
    const files = Array.from($('product-images').files || []);
    for (const file of files) {
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10*1024*1024) throw new Error('Each photo must be JPEG, PNG or WebP and no larger than 10 MB.');
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');
      const path = user.id + '/' + Date.now() + '-' + crypto.randomUUID() + '-' + safeName;
      const {error} = await client.storage.from('ibagency-products').upload(path,file,{contentType:file.type,upsert:false});
      if (error) throw error;
      const {data} = client.storage.from('ibagency-products').getPublicUrl(path);
      currentImages.push(data.publicUrl);
    }
  }
  async function loadProducts() {
    $('product-list').innerHTML = '<p>Loading saved products…</p>';
    const {data,error}=await client.from('ibagency_products').select('*').order('created_at',{ascending:false});
    if(error){$('product-list').innerHTML='';say('Could not load products: '+error.message,true);return;}
    if(!data.length){$('product-list').innerHTML='<p>No products yet. Add your first listing above.</p>';return;}
    $('product-list').innerHTML=data.map(p=>{
      const photo=p.image_urls&&p.image_urls[0] ? p.image_urls[0] : '';
      const price=p.price===null?'Price on request':escapeHtml(p.currency)+' '+Number(p.price).toLocaleString();
      return '<article class="admin-product"><img src="'+escapeHtml(photo||'assets/img/favicon.svg')+'" alt="" loading="lazy"><div><h4>'+escapeHtml(p.title)+'</h4><p>'+escapeHtml(p.category)+' · '+escapeHtml(p.listing_type||'For Sale')+' · '+escapeHtml(p.location)+'</p><p>'+price+' · <strong>'+escapeHtml(p.status)+'</strong></p></div><div class="admin-product-actions"><button type="button" data-edit="'+p.id+'">Edit</button><button type="button" data-delete="'+p.id+'" class="delete-product">Delete</button></div></article>';
    }).join('');
    $('product-list').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>editProduct(data.find(p=>p.id===b.dataset.edit))));
    $('product-list').querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteProduct(b.dataset.delete)));
  }
  function editProduct(p) {
    if(!p)return;
    $('product-id').value=p.id; $('product-title').value=p.title; $('product-category').value=p.category;
    $('product-price').value=p.price??''; $('product-currency').value=p.currency; $('product-location').value=p.location;
    $('product-description').value=p.description||''; $('product-status').value=p.status;
    currentImages=[...(p.image_urls||[])]; $('product-listing-type').value=p.listing_type||'For Sale'; renderExistingImages();
    $('form-heading').textContent='Edit product'; $('save-product').textContent='Update product';
    $('product-form').scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function deleteProduct(id) {
    const ok=window.confirm('Delete this product listing? This cannot be undone.');
    if(!ok)return;
    const {error}=await client.from('ibagency_products').delete().eq('id',id);
    if(error){say('Delete failed: '+error.message,true);return;}
    say('Product deleted.'); await loadProducts();
  }
  async function enterWorkspace(sessionUser) {
    user=sessionUser;
    const {data,error}=await client.from('ibagency_admins').select('user_id').eq('user_id',user.id).maybeSingle();
    if(error||!data){await client.auth.signOut();say('This account is not approved as an owner. Ask the project owner to add its user UUID to public.ibagency_admins in Supabase SQL Editor.',true);return;}
    loginPanel.hidden=true; workspace.hidden=false; $('signed-in-as').textContent='Signed in as '+user.email;
    await loadProducts(); await loadInquiries();
  }
  async function loadInquiries(){
    const box=$('inquiry-list');if(!box)return;box.innerHTML='<p>Loading inquiries…</p>';
    const {data,error}=await client.from('ibagency_inquiries').select('*').order('created_at',{ascending:false});
    if(error){box.innerHTML='<p>Could not load inquiries. Run the latest SUPABASE-SETUP.sql in Supabase SQL Editor. '+escapeHtml(error.message)+'</p>';return;}
    if(!data||!data.length){box.innerHTML='<p>No website inquiries yet.</p>';return;}
    box.innerHTML=data.map(i=>'<article class="admin-inquiry"><div class="admin-inquiry-head"><div><h4>'+escapeHtml(i.name)+'</h4><p>'+escapeHtml(i.category)+' · '+escapeHtml(i.created_at?new Date(i.created_at).toLocaleString():'')+'</p></div><select data-inquiry-status="'+i.id+'" aria-label="Inquiry status"><option value="new" '+(i.status==='new'?'selected':'')+'>New</option><option value="contacted" '+(i.status==='contacted'?'selected':'')+'>Contacted</option><option value="closed" '+(i.status==='closed'?'selected':'')+'>Closed</option></select></div><p><strong>Phone:</strong> '+escapeHtml(i.phone)+' · <strong>Location:</strong> '+escapeHtml(i.location||'Not specified')+'</p><p><strong>Budget:</strong> '+escapeHtml(i.budget||'Not specified')+'</p><p>'+escapeHtml(i.details||'No extra details')+'</p><div class="admin-inquiry-actions"><a href="https://wa.me/'+escapeHtml(i.phone.replace(/[^0-9]/g,''))+'?text='+encodeURIComponent('Hello '+i.name+', thank you for contacting iBAGENCY about '+i.category+'.')+'" target="_blank" rel="noopener noreferrer">Follow up on WhatsApp ↗</a><button type="button" data-delete-inquiry="'+i.id+'" class="delete-product">Delete inquiry</button></div></article>').join('');
    box.querySelectorAll('[data-inquiry-status]').forEach(s=>s.addEventListener('change',async()=>{const {error}=await client.from('ibagency_inquiries').update({status:s.value,updated_at:new Date().toISOString()}).eq('id',s.dataset.inquiryStatus);if(error){say('Could not update inquiry: '+error.message,true);return;}say('Inquiry status updated.');}));
    box.querySelectorAll('[data-delete-inquiry]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Delete this inquiry permanently?'))return;const {error}=await client.from('ibagency_inquiries').delete().eq('id',b.dataset.deleteInquiry);if(error){say('Could not delete inquiry: '+error.message,true);return;}say('Inquiry deleted.');await loadInquiries();}));
  }
  $('refresh-inquiries')?.addEventListener('click',loadInquiries);
  $('login-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const button=e.currentTarget.querySelector('button');
    const originalText=button.textContent;
    button.disabled=true;
    button.textContent='Signing in…';
    sayLogin('Connecting securely to sign in…');
    try {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        throw new Error('The sign-in service did not load. Check your internet connection, refresh the page, and try again.');
      }
      const {data,error}=await client.auth.signInWithPassword({
        email:$('login-email').value.trim(),
        password:$('login-password').value
      });
      if(error) throw error;
      sayLogin('');
      await enterWorkspace(data.user);
    } catch(err) {
      sayLogin('Sign-in failed: '+(err && err.message ? err.message : 'Unexpected error. Please refresh and try again.'),true);
    } finally {
      button.disabled=false;
      button.textContent=originalText;
    }
  });
  $('sign-out').addEventListener('click',async()=>{await client.auth.signOut();workspace.hidden=true;loginPanel.hidden=false;resetForm();say('You have signed out.');});
  $('cancel-edit').addEventListener('click',resetForm);
  $('product-form').addEventListener('submit',async e=>{
    e.preventDefault(); const button=$('save-product'); button.disabled=true;
    try {
      say('Uploading photos and saving product…');
      await uploadSelectedFiles();
      const id=$('product-id').value;
      const payload={
        title:$('product-title').value.trim(),category:$('product-category').value,listing_type:$('product-listing-type').value,
        description:$('product-description').value.trim(),price:$('product-price').value===''?null:Number($('product-price').value),
        currency:$('product-currency').value,location:$('product-location').value.trim(),
        image_urls:currentImages,status:$('product-status').value
      };
      let result;
      if(id) result=await client.from('ibagency_products').update(payload).eq('id',id);
      else result=await client.from('ibagency_products').insert({...payload,created_by:user.id});
      if(result.error)throw result.error;
      say('Product saved successfully. '+(payload.status==='published'?'It is now visible in public listings.':'It is not public because its status is '+payload.status+'.'));
      resetForm(); await loadProducts();
    } catch(err){say('Could not save product: '+(err.message||'Unexpected error'),true);}
    finally{button.disabled=false;}
  });
  client.auth.getSession().then(({data})=>{if(data.session)enterWorkspace(data.session.user);});
})();