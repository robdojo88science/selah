import {test,expect} from '@playwright/test';
async function write(page,title='A quiet trust'){
 await page.goto('/#devotion');await page.getByLabel('Devotion Title',{exact:true}).fill(title);
 await page.getByLabel('What is God teaching me through this passage?',{exact:true}).fill('First line\nSecond line');
 await page.getByLabel('How can I apply God’s Word to my life today?',{exact:true}).fill('Listen patiently.');
 await page.getByLabel('My Prayer',{exact:true}).fill('Thank you for today.');
 await page.getByRole('button',{name:'Save Devotion',exact:true}).click();
 await expect(page.locator('.journal [role=status]')).toHaveText('Saved locally · Completed');
}
test('save, reload, edit, preview, search, same date, export and deletion',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await write(page);
 await page.reload();await expect(page.getByLabel('Devotion Title',{exact:true})).toHaveValue('A quiet trust');
 await page.getByLabel('Devotion Title',{exact:true}).fill('Trust revisited');
 await page.getByRole('link',{name:'Devotion History',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Trust revisited'})).toBeVisible();
 await page.getByRole('button',{name:'View',exact:true}).click();await expect(page.locator('.preview')).toContainText('First line\nSecond line');
 await page.getByRole('button',{name:'Edit devotion',exact:true}).click();
 await page.getByRole('button',{name:'New devotion',exact:true}).click();
 await page.getByLabel('Devotion Title',{exact:true}).fill('Another prayer');
 await page.getByRole('button',{name:'Save Devotion',exact:true}).click();
 await page.getByRole('link',{name:'Devotion History',exact:true}).click();await expect(page.locator('.card')).toHaveCount(2);
 await page.getByRole('searchbox').fill('patiently');await expect(page.locator('.card')).toHaveCount(1);
 await page.getByRole('button',{name:'Clear filters'}).click();
 await page.getByRole('link',{name:'Settings',exact:true}).click();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export Backup',exact:true}).click();const download=await downloadPromise;expect(download.suggestedFilename()).toMatch(/^selah-backup/);
 await page.getByRole('link',{name:'Devotion History',exact:true}).click();
 await page.getByRole('button',{name:'Delete',exact:true}).first().click();
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('.card')).toHaveCount(2);
 await page.getByRole('button',{name:'Delete',exact:true}).first().click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.locator('.card')).toHaveCount(1);
 expect(errors).toEqual([]);
});
test('Bible reference, selection, handoff and saved reading position',async({page})=>{
 await page.goto('/#bible');await page.getByRole('textbox',{name:'Bible reference',exact:true}).fill('John 3:16');
 await page.getByRole('button',{name:'Go',exact:true}).click();await expect(page.getByRole('heading',{name:'John 3',exact:true})).toBeVisible();
 await expect(page.locator('.verse[aria-pressed=true]')).toHaveCount(1);
 await expect(page.locator('.verse[aria-pressed=true]')).toContainText('For God so loved the world');
 await page.getByRole('button',{name:'Use in Devotion'}).click();
 await expect(page.getByLabel('Scripture / Bible Passage',{exact:true})).toHaveValue('John 3:16');
 await expect(page.getByLabel('Selected Scripture',{exact:true})).toHaveValue(/For God so loved the world/);
 await page.getByLabel('Devotion Title',{exact:true}).fill('Love');
 await page.getByRole('link',{name:'Read Bible',exact:true}).click();
 await expect(page.getByRole('heading',{name:'John 3',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Next chapter →',exact:true}).click();await expect(page.getByRole('heading',{name:'John 4',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('heading',{name:'John 4',exact:true})).toBeVisible();
});
test('restore validates files, preserves conflicts, skips duplicates and renders text safely',async({page})=>{
 await write(page,'Original');await page.getByRole('link',{name:'Settings',exact:true}).click();
 const entries=await page.evaluate(async()=>{const {allEntries}=await import('/js/storage.js');return allEntries();});
 const payload={app:'selah',version:1,entries:[{...entries[0],title:'<img src=x onerror=alert(1)>',reflection:'Restored changed content'}]};
 const upload=()=>page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});
 await upload();await page.getByRole('button',{name:'Review and restore backup'}).click();
 await expect(page.locator('dialog')).toContainText('1 changed entries');await page.getByRole('button',{name:'Confirm',exact:true}).click();
 await expect(page.locator('#status')).toContainText('Restored 1');
 await upload();await page.getByRole('button',{name:'Review and restore backup'}).click();await expect(page.locator('#status')).toContainText('already on this device');
 await page.getByRole('link',{name:'Devotion History',exact:true}).click();await expect(page.locator('.card')).toHaveCount(2);await expect(page.locator('.card img')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'<img src=x onerror=alert(1)>'})).toBeVisible();
});
test('draft survives reload; failed storage does not report success and writing can be exported',async({page})=>{
 await page.goto('/#devotion');await page.getByLabel('Devotion Title',{exact:true}).fill('Autosaved draft');await expect(page.locator('.journal [role=status]')).toHaveText('Saved locally · Draft');
 await page.reload();await expect(page.getByLabel('Devotion Title',{exact:true})).toHaveValue('Autosaved draft');
 await page.evaluate(()=>{IDBObjectStore.prototype.put=function(){throw new DOMException('Quota exceeded','QuotaExceededError');};});
 await page.getByLabel('My Prayer',{exact:true}).fill('Keep these words.');
 await expect(page.locator('.journal [role=status]')).toContainText('Not saved');
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export this entry'}).click();expect((await pending).suggestedFilename()).toMatch(/\.md$/);
 await page.getByRole('link',{name:'Home',exact:true}).click();await expect(page.getByLabel('My Prayer',{exact:true})).toHaveValue('Keep these words.');
});
test('offline shell, full Bible and journal persist',async({page,context})=>{
 await page.goto('/');await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
 await page.getByRole('link',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Download / verify offline Bible'}).click();await expect(page.getByText('All 66 books are ready for offline reading on this device.',{exact:true})).toBeVisible({timeout:90000});
 await write(page,'Offline faith');await context.setOffline(true);await page.reload();await expect(page.getByLabel('Devotion Title',{exact:true})).toHaveValue('Offline faith');
 await page.getByLabel('My Prayer',{exact:true}).fill('Still here offline.');await page.getByRole('button',{name:'Save Devotion',exact:true}).click();await expect(page.locator('.journal [role=status]')).toHaveText('Saved locally · Completed');
 await page.getByRole('link',{name:'Read Bible',exact:true}).click();await page.getByLabel('Bible book',{exact:true}).selectOption('REV');await expect(page.getByRole('heading',{name:'Revelation 1',exact:true})).toBeVisible();await expect(page.locator('.verse')).not.toHaveCount(0);
});
test('responsive layouts and keyboard focus',async({page})=>{
 for(const width of [320,375,390,768,1024,1440,1920]){
 await page.setViewportSize({width,height:900});
 for(const section of ['home','bible','devotion','history','settings']){
 await page.goto('/#'+section);await expect(page.locator('main h1')).toBeVisible();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);expect(overflow,section+' at '+width).toBe(false);
 }}
 await page.setViewportSize({width:1440,height:1000});await page.goto('/');await page.screenshot({path:'test-results/selah-desktop.png',fullPage:true});await page.setViewportSize({width:375,height:900});await page.screenshot({path:'test-results/selah-mobile.png',fullPage:true});
 await page.keyboard.press('Tab');await expect(page.locator(':focus')).toBeVisible();
});

test('GitHub Pages-style subpath and offline refresh',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/selah/#devotion');
 await page.getByLabel('Devotion Title',{exact:true}).fill('Subpath journal');
 await page.getByRole('button',{name:'Save Devotion',exact:true}).click();await expect(page.locator('.journal [role=status]')).toHaveText('Saved locally · Completed');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
 await context.setOffline(true);await page.reload();await expect(page.getByLabel('Devotion Title',{exact:true})).toHaveValue('Subpath journal');
 await page.getByRole('link',{name:'Devotion History',exact:true}).click();await expect(page.getByRole('heading',{name:'Subpath journal'})).toBeVisible();expect(errors).toEqual([]);
});
test('unavailable browser storage shows honest notice and allows export',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'indexedDB',{get(){return undefined;}});});
 await page.goto('/#devotion');await expect(page.locator('#storage-warning')).toContainText('cannot save your journal');
 await page.getByLabel('My Prayer',{exact:true}).fill('Words I can still export.');
 await expect(page.locator('.journal [role=status]')).toContainText('Not saved');
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export this entry'}).click();expect((await pending).suggestedFilename()).toMatch(/\.md$/);
});
