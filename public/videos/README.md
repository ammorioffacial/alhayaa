# فيديوهات الهيرو في الصفحة الرئيسية

الملفات الحالية، وكلها بدون صوت، بدقة 1920 × 1080، ومدة 8 ثوانٍ، وأقل من 3 MB:

| الملف | الصيغة | الترتيب |
| --- | --- | --- |
| `hero-1.webm` و`hero-1.mp4` | WebM (VP9) و MP4 (H.264) | 1 |
| `hero-2.webm` و`hero-2.mp4` | WebM (VP9) و MP4 (H.264) | 2 |
| `hero-3.webm` و`hero-3.mp4` | WebM (VP9) و MP4 (H.264) | 3 |

## كيف تعمل

- تُعرض الفيديوهات بالترتيب وتتكرر. الانتقال بين فيديو وآخر يحدث عند انتهاء كل فيديو.
- الترتيب والأسماء في `src/lib/hero-media.ts` (المصفوفة `videos`). لإضافة فيديو أو تغييره: ضع الملفات بالاسم `hero-N.webm` و`hero-N.mp4`، ثم أضف `hero-N` إلى المصفوفة.
- الملف الذي لا يوجد يُتجاوز. وإذا لم يوجد أي ملف تُعرض صورة `public/images/care-bag-hero.webp`.
- الفحص يتم على الخادم، فلا يظهر أي خطأ 404 في المتصفح إذا حُذف ملف.
- عند تفعيل `prefers-reduced-motion` تُعرض الصورة الثابتة بدل الفيديو.

## إعادة الترميز (إن احتجت)

```bash
ffmpeg -i source.mp4 -t 8 -an -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30" -pix_fmt yuv420p -c:v libx264 -preset medium -profile:v high -b:v 1800k -maxrate 2200k -bufsize 3600k -movflags +faststart hero-N.mp4
ffmpeg -i source.mp4 -t 8 -an -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30" -c:v libvpx-vp9 -b:v 1600k -maxrate 2000k -bufsize 3200k -row-mt 1 -cpu-used 4 hero-N.webm
```
