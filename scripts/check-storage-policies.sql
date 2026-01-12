-- =====================================================
-- STORAGE POLICIES VERIFICATION
-- =====================================================
-- Bu sorgular, storage bucket'larının ve policies'lerinin
-- org_id validation içerip içermediğini kontrol eder.
--
-- ÇALIŞTIRMA: Supabase SQL Editor'de çalıştır
-- BEKLENEN: Tüm kontroller yapılacak, sonuçlar görüntülenecek
--
-- =====================================================

-- =====================================================
-- KONTROL 1: Bucket'lar Var mı?
-- =====================================================

SELECT 
  id as bucket_id,
  name,
  public as is_public,
  CASE 
    WHEN id IN ('property-photos', 'contract-pdfs') THEN '✅ Var'
    ELSE '❌ Yok'
  END as status
FROM storage.buckets
WHERE id IN ('property-photos', 'contract-pdfs')
ORDER BY id;

-- =====================================================
-- KONTROL 2: property-photos Bucket Policies
-- =====================================================

SELECT 
  'property-photos' as bucket_name,
  policyname as policy_name,
  cmd as operation,
  roles::text as roles,
  qual::text as using_clause,
  with_check::text as with_check_clause,
  CASE 
    WHEN qual::text LIKE '%org_id%' OR with_check::text LIKE '%org_id%' THEN '✅ org_id kontrolü var'
    WHEN qual::text LIKE '%org_members%' OR with_check::text LIKE '%org_members%' THEN '✅ org_members kontrolü var'
    WHEN qual::text LIKE '%get_user_org_ids%' OR with_check::text LIKE '%get_user_org_ids%' THEN '✅ get_user_org_ids kullanılıyor'
    ELSE '❌ org_id kontrolü YOK'
  END as org_validation_status
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (qual::text LIKE '%property-photos%' OR with_check::text LIKE '%property-photos%')
ORDER BY cmd, policyname;

-- =====================================================
-- KONTROL 3: contract-pdfs Bucket Policies
-- =====================================================

SELECT 
  'contract-pdfs' as bucket_name,
  policyname as policy_name,
  cmd as operation,
  roles::text as roles,
  qual::text as using_clause,
  with_check::text as with_check_clause,
  CASE 
    WHEN qual::text LIKE '%org_id%' OR with_check::text LIKE '%org_id%' THEN '✅ org_id kontrolü var'
    WHEN qual::text LIKE '%org_members%' OR with_check::text LIKE '%org_members%' THEN '✅ org_members kontrolü var'
    WHEN qual::text LIKE '%get_user_org_ids%' OR with_check::text LIKE '%get_user_org_ids%' THEN '✅ get_user_org_ids kullanılıyor'
    WHEN qual::text LIKE '%contracts%' AND (qual::text LIKE '%user_id%' OR qual::text LIKE '%org_id%') THEN '⚠️ Kontrat tablosu üzerinden kontrol var'
    ELSE '❌ org_id kontrolü YOK'
  END as org_validation_status
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (qual::text LIKE '%contract-pdfs%' OR with_check::text LIKE '%contract-pdfs%')
ORDER BY cmd, policyname;

-- =====================================================
-- KONTROL 4: Tüm Storage Policies Özeti
-- =====================================================

SELECT 
  CASE 
    WHEN qual::text LIKE '%property-photos%' OR with_check::text LIKE '%property-photos%' THEN 'property-photos'
    WHEN qual::text LIKE '%contract-pdfs%' OR with_check::text LIKE '%contract-pdfs%' THEN 'contract-pdfs'
    ELSE 'unknown'
  END as bucket_id,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
  COUNT(CASE 
    WHEN qual::text LIKE '%org_id%' 
      OR qual::text LIKE '%org_members%' 
      OR qual::text LIKE '%get_user_org_ids%'
      OR with_check::text LIKE '%org_id%'
      OR with_check::text LIKE '%org_members%'
      OR with_check::text LIKE '%get_user_org_ids%'
    THEN 1 
  END) as policies_with_org_validation,
  CASE 
    WHEN COUNT(CASE 
      WHEN qual::text LIKE '%org_id%' 
        OR qual::text LIKE '%org_members%' 
        OR qual::text LIKE '%get_user_org_ids%'
        OR with_check::text LIKE '%org_id%'
        OR with_check::text LIKE '%org_members%'
        OR with_check::text LIKE '%get_user_org_ids%'
      THEN 1 
    END) = COUNT(*) THEN '✅ Tüm policies güvenli'
    WHEN COUNT(CASE 
      WHEN qual::text LIKE '%org_id%' 
        OR qual::text LIKE '%org_members%' 
        OR qual::text LIKE '%get_user_org_ids%'
        OR with_check::text LIKE '%org_id%'
        OR with_check::text LIKE '%org_members%'
        OR with_check::text LIKE '%get_user_org_ids%'
      THEN 1 
    END) > 0 THEN '⚠️ Bazı policies güvenli'
    ELSE '❌ Hiçbir policy güvenli değil'
  END as security_status
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual::text LIKE '%property-photos%' 
    OR qual::text LIKE '%contract-pdfs%'
    OR with_check::text LIKE '%property-photos%'
    OR with_check::text LIKE '%contract-pdfs%'
  )
GROUP BY 
  CASE 
    WHEN qual::text LIKE '%property-photos%' OR with_check::text LIKE '%property-photos%' THEN 'property-photos'
    WHEN qual::text LIKE '%contract-pdfs%' OR with_check::text LIKE '%contract-pdfs%' THEN 'contract-pdfs'
    ELSE 'unknown'
  END
ORDER BY bucket_id;

-- =====================================================
-- KONTROL 5: Detaylı Policy Analizi
-- =====================================================

SELECT 
  CASE 
    WHEN qual::text LIKE '%property-photos%' OR with_check::text LIKE '%property-photos%' THEN 'property-photos'
    WHEN qual::text LIKE '%contract-pdfs%' OR with_check::text LIKE '%contract-pdfs%' THEN 'contract-pdfs'
    ELSE 'unknown'
  END as bucket_id,
  policyname as policy_name,
  cmd as operation,
  CASE 
    WHEN roles::text LIKE '%public%' THEN '🌐 Public'
    WHEN roles::text LIKE '%authenticated%' THEN '🔐 Authenticated'
    ELSE roles::text
  END as access_level,
  CASE 
    -- property-photos için public read kabul edilebilir
    WHEN (qual::text LIKE '%property-photos%' OR with_check::text LIKE '%property-photos%') 
      AND cmd = 'SELECT' 
      AND roles::text LIKE '%public%' 
    THEN '✅ OK (Public listing photos)'
    -- contract-pdfs için public erişim KESINLIKLE OLMAMALI
    WHEN (qual::text LIKE '%contract-pdfs%' OR with_check::text LIKE '%contract-pdfs%') 
      AND roles::text LIKE '%public%' 
    THEN '❌ KRİTİK: Private bucket public erişime açık!'
    -- org_id kontrolü var mı?
    WHEN qual::text LIKE '%org_id%' OR with_check::text LIKE '%org_id%' THEN '✅ org_id kontrolü var'
    WHEN qual::text LIKE '%org_members%' OR with_check::text LIKE '%org_members%' THEN '✅ org_members kontrolü var'
    WHEN qual::text LIKE '%get_user_org_ids%' OR with_check::text LIKE '%get_user_org_ids%' THEN '✅ get_user_org_ids kullanılıyor'
    -- contract-pdfs için contracts tablosu üzerinden kontrol var mı?
    WHEN (qual::text LIKE '%contract-pdfs%' OR with_check::text LIKE '%contract-pdfs%') 
      AND (qual::text LIKE '%contracts%' OR with_check::text LIKE '%contracts%') 
    THEN '⚠️ Kontrat tablosu kontrolü var (org_id kontrolü gerekli)'
    -- Sadece bucket_id kontrolü var (GÜVENSİZ!)
    WHEN (qual::text LIKE '%bucket_id%' OR with_check::text LIKE '%bucket_id%') 
      AND NOT (qual::text LIKE '%org_id%' OR qual::text LIKE '%org_members%' OR qual::text LIKE '%get_user_org_ids%' OR qual::text LIKE '%contracts%' OR with_check::text LIKE '%org_id%' OR with_check::text LIKE '%org_members%' OR with_check::text LIKE '%get_user_org_ids%' OR with_check::text LIKE '%contracts%')
    THEN '❌ GÜVENSİZ: Sadece bucket_id kontrolü var, org_id yok!'
    ELSE '❓ Belirsiz - manuel kontrol gerekli'
  END as security_assessment,
  LEFT(qual::text, 100) as using_clause_preview,
  LEFT(with_check::text, 100) as with_check_clause_preview
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual::text LIKE '%property-photos%' 
    OR qual::text LIKE '%contract-pdfs%'
    OR with_check::text LIKE '%property-photos%'
    OR with_check::text LIKE '%contract-pdfs%'
  )
ORDER BY 
  CASE 
    WHEN qual::text LIKE '%property-photos%' OR with_check::text LIKE '%property-photos%' THEN 'property-photos'
    WHEN qual::text LIKE '%contract-pdfs%' OR with_check::text LIKE '%contract-pdfs%' THEN 'contract-pdfs'
    ELSE 'unknown'
  END,
  cmd, 
  policyname;

-- =====================================================
-- ÖZET RAPOR
-- =====================================================

DO $$
DECLARE
  property_photos_bucket_exists BOOLEAN;
  contract_pdfs_bucket_exists BOOLEAN;
  property_photos_policies_count INT;
  contract_pdfs_policies_count INT;
  property_photos_has_org_check INT;
  contract_pdfs_has_org_check INT;
BEGIN
  -- Bucket'lar var mı?
  SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'property-photos') INTO property_photos_bucket_exists;
  SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'contract-pdfs') INTO contract_pdfs_bucket_exists;
  
  -- Policy sayıları
  SELECT COUNT(*) INTO property_photos_policies_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (qual::text LIKE '%property-photos%' OR with_check::text LIKE '%property-photos%');
  
  SELECT COUNT(*) INTO contract_pdfs_policies_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (qual::text LIKE '%contract-pdfs%' OR with_check::text LIKE '%contract-pdfs%');
  
  -- org_id kontrolü var mı?
  SELECT COUNT(*) INTO property_photos_has_org_check
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (qual::text LIKE '%property-photos%' OR with_check::text LIKE '%property-photos%')
    AND (
      qual::text LIKE '%org_id%' 
      OR qual::text LIKE '%org_members%' 
      OR qual::text LIKE '%get_user_org_ids%'
      OR with_check::text LIKE '%org_id%'
      OR with_check::text LIKE '%org_members%'
      OR with_check::text LIKE '%get_user_org_ids%'
    );
  
  SELECT COUNT(*) INTO contract_pdfs_has_org_check
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (qual::text LIKE '%contract-pdfs%' OR with_check::text LIKE '%contract-pdfs%')
    AND (
      qual::text LIKE '%org_id%' 
      OR qual::text LIKE '%org_members%' 
      OR qual::text LIKE '%get_user_org_ids%'
      OR with_check::text LIKE '%org_id%'
      OR with_check::text LIKE '%org_members%'
      OR with_check::text LIKE '%get_user_org_ids%'
    );
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'STORAGE POLICIES VERIFICATION ÖZET';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  
  -- property-photos
  IF property_photos_bucket_exists THEN
    RAISE NOTICE 'property-photos Bucket:';
    RAISE NOTICE '  ✅ Bucket mevcut';
    RAISE NOTICE '  📋 Policies: % adet', property_photos_policies_count;
    IF property_photos_has_org_check > 0 THEN
      RAISE NOTICE '  ✅ org_id kontrolü var (% policy)', property_photos_has_org_check;
    ELSE
      RAISE NOTICE '  ❌ org_id kontrolü YOK - GÜVENLİK AÇIĞI!';
    END IF;
  ELSE
    RAISE NOTICE 'property-photos Bucket:';
    RAISE NOTICE '  ❌ Bucket bulunamadı';
  END IF;
  
  RAISE NOTICE '';
  
  -- contract-pdfs
  IF contract_pdfs_bucket_exists THEN
    RAISE NOTICE 'contract-pdfs Bucket:';
    RAISE NOTICE '  ✅ Bucket mevcut';
    RAISE NOTICE '  📋 Policies: % adet', contract_pdfs_policies_count;
    IF contract_pdfs_has_org_check > 0 THEN
      RAISE NOTICE '  ✅ org_id kontrolü var (% policy)', contract_pdfs_has_org_check;
    ELSE
      RAISE NOTICE '  ❌ org_id kontrolü YOK - KRİTİK GÜVENLİK AÇIĞI!';
      RAISE NOTICE '     Herhangi bir authenticated user başka org''un contract PDF''lerine erişebilir!';
    END IF;
  ELSE
    RAISE NOTICE 'contract-pdfs Bucket:';
    RAISE NOTICE '  ❌ Bucket bulunamadı';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  
  IF property_photos_has_org_check = 0 OR contract_pdfs_has_org_check = 0 THEN
    RAISE NOTICE '❌ GÜVENLİK AÇIĞI TESPİT EDİLDİ!';
    RAISE NOTICE '   Storage policies''e org_id validation eklenmeli.';
  ELSE
    RAISE NOTICE '✅ Tüm bucket''lar güvenli görünüyor.';
  END IF;
  
  RAISE NOTICE '=====================================================';
  
END $$;
