-- OPTIONAL sample data, deliberately blocked from real checkout.
insert into public.products(id,name,brand,category,description,price,image_url,available,featured,is_demo) values
 ('00000000-0000-4000-8000-000000000001','غسول الوجه المرطب','HAYAT CARE','العناية بالبشرة','منتج توضيحي لتجربة المتجر، وليس عرضاً تجارياً.',24000,'/products/cleanser.svg',true,true,true),
 ('00000000-0000-4000-8000-000000000002','سيروم العناية بالبشرة','DAILY RITUAL','العناية بالبشرة','منتج توضيحي لتجربة المتجر، وليس عرضاً تجارياً.',32000,'/products/serum.svg',true,true,true),
 ('00000000-0000-4000-8000-000000000003','واقي الشمس اليومي','SUN ESSENTIALS','واقيات الشمس','منتج توضيحي لتجربة المتجر، وليس عرضاً تجارياً.',28000,'/products/sun.svg',true,true,true),
 ('00000000-0000-4000-8000-000000000004','شامبو العناية بالشعر','BOTANICAL CARE','العناية بالشعر','منتج توضيحي لتجربة المتجر، وليس عرضاً تجارياً.',22000,'/products/hair.svg',true,true,true),
 ('00000000-0000-4000-8000-000000000005','كريم ترطيب الوجه','HAYAT CARE','العناية بالبشرة','منتج توضيحي لتجربة المتجر، وليس عرضاً تجارياً.',26000,'/products/cream.svg',true,false,true),
 ('00000000-0000-4000-8000-000000000006','تينت الشفاه الوردي','SOFT BEAUTY','مستحضرات التجميل','منتج توضيحي لتجربة المتجر، وليس عرضاً تجارياً.',18000,'/products/tint.svg',false,false,true)
 on conflict(id) do nothing;
-- To remove sample products:
-- delete from public.products where is_demo=true;
