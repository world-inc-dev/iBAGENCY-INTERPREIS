(() => {
  const SUPABASE_URL = 'https://jkwhnahxkmqzplgvpbre.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_tHga70SJR6CGFz3VPBcfWg_UtY_bfai';
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const $ = id => document.getElementById(id);
  const loginPanel = $('login-panel'), workspace = $('workspace'), message = $('admin-message');
  let user = null, currentImages = [];

  function say(text, error=false) { message.textContent = text; message.classList.toggle('error', error); }
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
      return '<article class="admin-product"><img src="'+escapeHtml(photo||'assets/img/favicon.svg')+'" alt="" loading="lazy"><div><h4>'+escapeHtml(p.title)+'</h4><p>'+escapeHtml(p.category)+' · '+escapeHtml(p.location)+'</p><p>'+price+' · <strong>'+escapeHtml(p.status)+'</strong></p></div><div class="admin-product-actions"><button type="button" data-edit="'+p.id+'">Edit</button><button type="button" data-delete="'+p.id+'" class="delete-product">Delete</button></div></article>';
    }).join('');
    $('product-list').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>editProduct(data.find(p=>p.id===b.dataset.edit))));
    $('product-list').querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteProduct(b.dataset.delete)));
  }
  function editProduct(p) {
    if(!p)return;
    $('product-id').value=p.id; $('product-title').value=p.title; $('product-category').value=p.category;
    $('product-price').value=p.price??''; $('product-currency').value=p.currency; $('product-location').value=p.location;
    $('product-description').value=p.description||''; $('product-status').value=p.status;
    currentImages=[...(p.image_urls||[])]; renderExistingImages();
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
    await loadProducts();
  }
  $('login-form').addEventListener('submit',async e=>{
    e.preventDefault(); const button=e.currentTarget.querySelector('button'); button.disabled=true;
    say('Signing in…');
    const {data,error}=await client.auth.signInWithPassword({email:$('login-email').value.trim(),password:$('login-password').value});
    button.disabled=false;
    if(error){say('Sign-in failed: '+error.message,true);return;}
    await enterWorkspace(data.user);
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
        title:$('product-title').value.trim(),category:$('product-category').value,
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