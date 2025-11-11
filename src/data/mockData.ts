import type { 
  PropertyOwner, 
  Property, 
  Tenant, 
  Contract, 
  PropertyPhoto 
} from '../types';

type TenantWithPropertyId = Tenant & { property_id: string | null };

// Mock Property Owners - Realistic Turkish names and data
export const mockPropertyOwners: PropertyOwner[] = [
  {
    id: 'owner-1',
    user_id: 'demo-user',
    name: 'Mehmet Özkan',
    phone: '+90 532 123 4567',
    email: 'mehmet.ozkan@gmail.com',
    address: 'Kadıköy, İstanbul',
    notes: 'Emekli öğretmen, kiracılarla iyi ilişkiler kuran saygın emlak sahibi.',
    created_at: '2023-01-15T10:30:00Z',
    updated_at: '2024-10-15T14:20:00Z',
  },
  {
    id: 'owner-2',
    user_id: 'demo-user',
    name: 'Elif Yıldırım',
    phone: '+90 541 987 6543',
    email: 'elif.yildirim@hotmail.com',
    address: 'Beşiktaş, İstanbul',
    notes: 'Genç girişimci, teknolojiye açık modern yaklaşımı var.',
    created_at: '2023-03-22T09:15:00Z',
    updated_at: '2024-10-10T11:45:00Z',
  },
  {
    id: 'owner-3',
    user_id: 'demo-user',
    name: 'Anadolu İnşaat Ltd. Şti.',
    phone: '+90 212 555 0123',
    email: 'info@anadoluinsaat.com.tr',
    address: 'Maslak, İstanbul',
    notes: 'Kurumsal emlak yatırım şirketi, çoklu daire portföyü.',
    created_at: '2023-02-08T16:45:00Z',
    updated_at: '2024-10-20T08:30:00Z',
  },
  {
    id: 'owner-4',
    user_id: 'demo-user',
    name: 'Ayşe ve Hasan Demir',
    phone: '+90 505 444 7788',
    email: 'demirler@outlook.com',
    address: 'Üsküdar, İstanbul',
    notes: 'Karı-koca ortak mülk sahipleri, aile mirası gayrimenkuller.',
    created_at: '2023-05-10T13:20:00Z',
    updated_at: '2024-09-25T16:10:00Z',
  },
];

// Mock Properties - Various Istanbul districts and property types
export const mockProperties: Property[] = [
  {
    id: 'property-1',
    address: 'Bağdat Caddesi No: 245/3, Kadıköy, İstanbul',
    city: 'İstanbul',
    district: 'Kadıköy',
    status: 'Occupied',
    notes: 'Bağdat Caddesine yakın, asansörlü bina, balkonlu, merkezi konumda.',
    owner_id: 'owner-1',
    created_at: '2023-01-20T11:00:00Z',
    updated_at: '2024-10-15T14:30:00Z',
    currency: 'TRY',
    listing_url: null,
    rent_amount: 8500,
    sale_price: null,
    sold_at: null,
    sold_price: null,
    user_id: 'demo-user',
  },
  {
    id: 'property-2',
    address: 'Acıbadem Mahallesi, Çeçen Sokak No: 15/7, Kadıköy, İstanbul',
    city: 'İstanbul',
    district: 'Kadıköy',
    status: 'Empty',
    notes: 'Yeni tadilat, modern mutfak, güneş alan daire. Metro yakını.',
    owner_id: 'owner-1',
    created_at: '2023-04-12T14:15:00Z',
    updated_at: '2024-10-22T09:45:00Z',
    currency: 'TRY',
    listing_url: null,
    rent_amount: 12000,
    sale_price: null,
    sold_at: null,
    sold_price: null,
    user_id: 'demo-user',
  },
  {
    id: 'property-3',
    address: 'Nisbetiye Caddesi No: 88/12, Beşiktaş, İstanbul',
    city: 'İstanbul',
    district: 'Beşiktaş',
    status: 'Occupied',
    notes: 'Lüks dubleks daire, deniz manzaralı, geniş terası var.',
    owner_id: 'owner-2',
    created_at: '2023-02-28T16:30:00Z',
    updated_at: '2024-10-18T12:20:00Z',
    currency: 'TRY',
    listing_url: null,
    rent_amount: 15000,
    sale_price: null,
    sold_at: null,
    sold_price: null,
    user_id: 'demo-user',
  },
  {
    id: 'property-4',
    address: 'Levent Mahallesi, Büyükdere Caddesi No: 156/24, Beşiktaş, İstanbul',
    city: 'İstanbul',
    district: 'Levent',
    status: 'Occupied',
    notes: 'İş merkezlerine yakın, modern bina, güvenlikli.',
    owner_id: 'owner-3',
    created_at: '2023-03-15T10:45:00Z',
    updated_at: '2024-10-12T15:10:00Z',
    currency: 'TRY',
    listing_url: null,
    rent_amount: 7800,
    sale_price: null,
    sold_at: null,
    sold_price: null,
    user_id: 'demo-user',
  },
  {
    id: 'property-5',
    address: 'Maslak 1453 Rezidans A Blok No: 45, Maslak, İstanbul',
    city: 'İstanbul',
    district: 'Maslak',
    status: 'Empty',
    notes: 'Rezidans içinde stüdyo daire, sosyal tesisler mevcut.',
    owner_id: 'owner-3',
    created_at: '2023-06-08T09:20:00Z',
    updated_at: '2024-10-20T11:35:00Z',
    currency: 'TRY',
    listing_url: null,
    rent_amount: 11000,
    sale_price: 4500000,
    sold_at: null,
    sold_price: null,
    user_id: 'demo-user',
  },
  {
    id: 'property-6',
    address: 'Validebağ Mahallesi, Bağlarbaşı Caddesi No: 78/5, Üsküdar, İstanbul',
    city: 'İstanbul',
    district: 'Üsküdar',
    status: 'Occupied',
    notes: 'Sakin mahalle, aile için ideal, parklar yakında.',
    owner_id: 'owner-4',
    created_at: '2023-05-25T13:10:00Z',
    updated_at: '2024-10-08T17:25:00Z',
    currency: 'TRY',
    listing_url: null,
    rent_amount: 7200,
    sale_price: null,
    sold_at: null,
    sold_price: null,
    user_id: 'demo-user',
  },
  {
    id: 'property-7',
    address: 'Çengelköy İskelesi Yakını, Üsküdar, İstanbul',
    city: 'İstanbul',
    district: 'Üsküdar',
    status: 'Empty',
    notes: 'Boğaz manzaralı, tarihi mahalle, ulaşım kolay.',
    owner_id: 'owner-4',
    created_at: '2023-07-14T12:45:00Z',
    updated_at: '2024-10-25T10:15:00Z',
    currency: 'TRY',
    listing_url: null,
    rent_amount: 9500,
    sale_price: null,
    sold_at: null,
    sold_price: null,
    user_id: 'demo-user',
  },
  {
    id: 'property-8',
    address: 'Fenerbahçe Mahallesi, Kalamış Parkı Karşısı, Kadıköy, İstanbul',
    city: 'İstanbul',
    district: 'Kadıköy',
    status: 'Inactive',
    notes: 'Tadilat bekliyor, denize yakın lokasyon, yatırım fırsatı.',
    owner_id: 'owner-2',
    created_at: '2023-08-30T15:30:00Z',
    updated_at: '2024-10-01T14:40:00Z',
    currency: 'TRY',
    listing_url: null,
    rent_amount: null,
    sale_price: null,
    sold_at: null,
    sold_price: null,
    user_id: 'demo-user',
  },
];

// Mock Tenants - Realistic Turkish tenant profiles
export const mockTenants: TenantWithPropertyId[] = [
  {
    id: 'tenant-1',
    name: 'Ahmet Kaya',
    phone: '+90 534 567 8901',
    email: 'ahmet.kaya@outlook.com',
    property_id: 'property-1',
    notes: 'İyi kiracı, ödemeleri zamanında yapar. 2 yıldır bu dairede.',
    created_at: '2023-02-01T10:00:00Z',
    updated_at: '2024-10-15T14:20:00Z',
    user_id: 'demo-user',
  },
  {
    id: 'tenant-2',
    name: 'Zeynep Arslan',
    phone: '+90 542 789 0123',
    email: 'zeynep.arslan@gmail.com',
    property_id: 'property-3',
    notes: 'Genç profesyonel, bankacı. Düzenli ve titiz kiracı.',
    created_at: '2023-03-10T11:30:00Z',
    updated_at: '2024-10-18T12:15:00Z',
    user_id: 'demo-user',
  },
  {
    id: 'tenant-3',
    name: 'Murat ve Seda Çelik',
    phone: '+90 555 234 5678',
    email: 'celikler.family@hotmail.com',
    property_id: 'property-4',
    notes: 'Yeni evli çift, sessiz ve saygılı. Daire bakımına özen gösteriyorlar.',
    created_at: '2023-04-05T14:45:00Z',
    updated_at: '2024-10-12T16:30:00Z',
    user_id: 'demo-user',
  },
  {
    id: 'tenant-4',
    name: 'Fatma Hanım',
    phone: '+90 506 345 6789',
    email: 'fatmahanim@yahoo.com',
    property_id: 'property-6',
    notes: 'Emekli öğretmen, temiz ve düzenli. Uzun vadeli kiracı.',
    created_at: '2023-06-12T09:20:00Z',
    updated_at: '2024-10-08T17:10:00Z',
    user_id: 'demo-user',
  },
  {
    id: 'tenant-5',
    name: 'Can Demir',
    phone: '+90 533 456 7890',
    email: 'can.demir@teknofirma.com',
    property_id: null,
    notes: 'IT uzmanı, yeni daire arıyor. Referansları çok iyi.',
    created_at: '2024-09-15T13:15:00Z',
    updated_at: '2024-10-20T11:45:00Z',
    user_id: 'demo-user',
  },
  {
    id: 'tenant-6',
    name: 'Öğrenci Ayşe',
    phone: '+90 544 678 9012',
    email: 'ayse.ogrenci@universite.edu.tr',
    property_id: null,
    notes: 'Üniversite öğrencisi, aileden garantili. Küçük daire arıyor.',
    created_at: '2024-10-01T16:30:00Z',
    updated_at: '2024-10-22T09:20:00Z',
    user_id: 'demo-user',
  },
  {
    id: 'tenant-7',
    name: 'Yabancı John Smith',
    phone: '+90 535 789 0123',
    email: 'john.smith@multinational.com',
    property_id: null,
    notes: 'Uluslararası şirkette çalışan yabancı. İngilizce konuşuyor.',
    created_at: '2024-10-10T12:00:00Z',
    updated_at: '2024-10-25T14:50:00Z',
    user_id: 'demo-user',
  },
];

// Mock Contracts - Various contract statuses and scenarios
export const mockContracts: Contract[] = [
  {
    id: 'contract-1',
    tenant_id: 'tenant-1',
    property_id: 'property-1',
    start_date: '2023-02-01',
    end_date: '2025-01-31',
    rent_amount: 8500,
    currency: 'TRY',
    status: 'Active',
    notes: 'İki yıllık sözleşme, yıllık %25 artış klozu var.',
    rent_increase_reminder_enabled: true,
    rent_increase_reminder_days: 90,
    rent_increase_reminder_contacted: false,
    expected_new_rent: 10625,
    reminder_notes: '2025 yılı için %25 artış planlanıyor.',
    contract_pdf_path: '/demo-contracts/contract-1.pdf',
    created_at: '2023-02-01T10:00:00Z',
    updated_at: '2024-10-15T14:20:00Z',
    user_id: 'demo-user',
  },
  {
    id: 'contract-2',
    tenant_id: 'tenant-2',
    property_id: 'property-3',
    start_date: '2023-03-15',
    end_date: '2024-03-14',
    rent_amount: 14000,
    currency: 'TRY',
    status: 'Archived',
    notes: 'Eski sözleşme sona erdi, kiracı yenileme istedi.',
    rent_increase_reminder_enabled: false,
    rent_increase_reminder_days: null,
    rent_increase_reminder_contacted: true,
    expected_new_rent: null,
    reminder_notes: null,
    contract_pdf_path: null,
    created_at: '2023-03-15T11:30:00Z',
    updated_at: '2024-03-14T18:00:00Z',
    user_id: 'demo-user',
  },
  {
    id: 'contract-3',
    tenant_id: 'tenant-2',
    property_id: 'property-3',
    start_date: '2024-03-15',
    end_date: '2025-03-14',
    rent_amount: 15000,
    currency: 'TRY',
    status: 'Active',
    notes: 'Yenilenen sözleşme, kira artışı yapıldı.',
    rent_increase_reminder_enabled: true,
    rent_increase_reminder_days: 120,
    rent_increase_reminder_contacted: false,
    expected_new_rent: 18000,
    reminder_notes: 'Lokasyon çok değerli, iyi artış potansiyeli var.',
    contract_pdf_path: null,
    created_at: '2024-03-15T12:00:00Z',
    updated_at: '2024-10-18T12:15:00Z',
    user_id: 'demo-user',
  },
  {
    id: 'contract-4',
    tenant_id: 'tenant-3',
    property_id: 'property-4',
    start_date: '2023-04-10',
    end_date: '2025-04-09',
    rent_amount: 7800,
    currency: 'TRY',
    status: 'Active',
    notes: 'Genç çift için iki yıllık özel anlaşma.',
    rent_increase_reminder_enabled: true,
    rent_increase_reminder_days: 60,
    rent_increase_reminder_contacted: false,
    expected_new_rent: 9000,
    reminder_notes: 'Kiracılar memnun, makul artış yapılacak.',
    contract_pdf_path: null,
    created_at: '2023-04-10T14:45:00Z',
    updated_at: '2024-10-12T16:30:00Z',
    user_id: 'demo-user',
  },
  {
    id: 'contract-5',
    tenant_id: 'tenant-4',
    property_id: 'property-6',
    start_date: '2023-06-15',
    end_date: '2024-12-14',
    rent_amount: 7200,
    currency: 'TRY',
    status: 'Active',
    notes: 'Uzun vadeli kiracı için özel indirimli kira.',
    rent_increase_reminder_enabled: true,
    rent_increase_reminder_days: 45,
    rent_increase_reminder_contacted: true,
    expected_new_rent: 8200,
    reminder_notes: 'Kiracıyla görüşüldü, artış konusunda anlaşıldı.',
    contract_pdf_path: null,
    created_at: '2023-06-15T09:20:00Z',
    updated_at: '2024-10-08T17:10:00Z',
    user_id: 'demo-user',
  },
  {
    id: 'contract-6',
    tenant_id: 'tenant-1',
    property_id: 'property-1',
    start_date: '2021-02-01',
    end_date: '2023-01-31',
    rent_amount: 6500,
    currency: 'TRY',
    status: 'Archived',
    notes: 'Önceki dönem sözleşmesi, artış sonrası yenilendi.',
    rent_increase_reminder_enabled: false,
    rent_increase_reminder_days: null,
    rent_increase_reminder_contacted: true,
    expected_new_rent: null,
    reminder_notes: null,
    contract_pdf_path: null,
    created_at: '2021-02-01T10:00:00Z',
    updated_at: '2023-01-31T23:59:00Z',
    user_id: 'demo-user',
  },
];

// Mock Property Photos - Sample images for demonstration
export const mockPropertyPhotos: PropertyPhoto[] = [
  // Property 1 Photos
  {
    id: 'photo-1-1',
    property_id: 'property-1',
    file_path: '/demo-images/kadikoy-apartment-1.jpg',
    sort_order: 1,
    created_at: '2023-01-20T11:30:00Z',
  },
  {
    id: 'photo-1-2',
    property_id: 'property-1',
    file_path: '/demo-images/kadikoy-apartment-2.jpg',
    sort_order: 2,
    created_at: '2023-01-20T11:31:00Z',
  },
  {
    id: 'photo-1-3',
    property_id: 'property-1',
    file_path: '/demo-images/kadikoy-apartment-3.jpg',
    sort_order: 3,
    created_at: '2023-01-20T11:32:00Z',
  },
  // Property 2 Photos
  {
    id: 'photo-2-1',
    property_id: 'property-2',
    file_path: '/demo-images/acibadem-apartment-1.jpg',
    sort_order: 1,
    created_at: '2023-04-12T14:30:00Z',
  },
  {
    id: 'photo-2-2',
    property_id: 'property-2',
    file_path: '/demo-images/acibadem-apartment-2.jpg',
    sort_order: 2,
    created_at: '2023-04-12T14:31:00Z',
  },
  // Property 3 Photos
  {
    id: 'photo-3-1',
    property_id: 'property-3',
    file_path: '/demo-images/besiktas-duplex-1.jpg',
    sort_order: 1,
    created_at: '2023-02-28T17:00:00Z',
  },
  {
    id: 'photo-3-2',
    property_id: 'property-3',
    file_path: '/demo-images/besiktas-duplex-2.jpg',
    sort_order: 2,
    created_at: '2023-02-28T17:01:00Z',
  },
  {
    id: 'photo-3-3',
    property_id: 'property-3',
    file_path: '/demo-images/besiktas-duplex-3.jpg',
    sort_order: 3,
    created_at: '2023-02-28T17:02:00Z',
  },
  {
    id: 'photo-3-4',
    property_id: 'property-3',
    file_path: '/demo-images/besiktas-duplex-4.jpg',
    sort_order: 4,
    created_at: '2023-02-28T17:03:00Z',
  },
  // Property 4 Photos
  {
    id: 'photo-4-1',
    property_id: 'property-4',
    file_path: '/demo-images/levent-apartment-1.jpg',
    sort_order: 1,
    created_at: '2023-03-15T11:00:00Z',
  },
  {
    id: 'photo-4-2',
    property_id: 'property-4',
    file_path: '/demo-images/levent-apartment-2.jpg',
    sort_order: 2,
    created_at: '2023-03-15T11:01:00Z',
  },
  // Property 5 Photos
  {
    id: 'photo-5-1',
    property_id: 'property-5',
    file_path: '/demo-images/maslak-studio-1.jpg',
    sort_order: 1,
    created_at: '2023-06-08T09:45:00Z',
  },
  // Property 6 Photos
  {
    id: 'photo-6-1',
    property_id: 'property-6',
    file_path: '/demo-images/uskudar-apartment-1.jpg',
    sort_order: 1,
    created_at: '2023-05-25T13:30:00Z',
  },
  {
    id: 'photo-6-2',
    property_id: 'property-6',
    file_path: '/demo-images/uskudar-apartment-2.jpg',
    sort_order: 2,
    created_at: '2023-05-25T13:31:00Z',
  },
  // Property 7 Photos
  {
    id: 'photo-7-1',
    property_id: 'property-7',
    file_path: '/demo-images/cengelkoy-apartment-1.jpg',
    sort_order: 1,
    created_at: '2023-07-14T13:00:00Z',
  },
];

// Helper function to get all mock data organized
export const getMockData = () => ({
  propertyOwners: mockPropertyOwners,
  properties: mockProperties,
  tenants: mockTenants,
  contracts: mockContracts,
  propertyPhotos: mockPropertyPhotos,
});

// Helper function to generate statistics from mock data
export const getMockStats = () => {
  const properties = mockProperties;
  const contracts = mockContracts;
  
  const totalProperties = properties.length;
  const emptyProperties = properties.filter(p => p.status === 'Empty').length;
  const occupiedProperties = properties.filter(p => p.status === 'Occupied').length;
  const inactiveProperties = properties.filter(p => p.status === 'Inactive').length;
  
  const activeContracts = contracts.filter(c => c.status === 'Active').length;
  
  // Calculate expiring contracts (within 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const expiringContracts = contracts.filter(c => {
    if (c.status !== 'Active') return false;
    const endDate = new Date(c.end_date);
    return endDate >= today && endDate <= thirtyDaysFromNow;
  }).length;

  return {
    totalProperties,
    emptyProperties, 
    occupiedProperties,
    inactiveProperties,
    activeContracts,
    expiringContracts,
  };
};

// Helper to get mock data with relationships (join-like functionality)
export const getMockDataWithRelations = () => {
  const data = getMockData();
  
  // Properties with owners
  const propertiesWithOwners = data.properties.map(property => ({
    ...property,
    owner: data.propertyOwners.find(owner => owner.id === property.owner_id),
    photos: data.propertyPhotos.filter(photo => photo.property_id === property.id),
  }));
  
  // Tenants with properties
  const tenantsWithProperties = data.tenants.map(tenant => ({
    ...tenant,
    property: data.properties.find(property => property.id === tenant.property_id),
  }));
  
  // Contracts with tenant and property details
  const contractsWithDetails = data.contracts.map(contract => ({
    ...contract,
    tenant: data.tenants.find(tenant => tenant.id === contract.tenant_id),
    property: data.properties.find(property => property.id === contract.property_id),
  }));
  
  return {
    propertyOwners: data.propertyOwners,
    properties: propertiesWithOwners,
    tenants: tenantsWithProperties,
    contracts: contractsWithDetails,
    propertyPhotos: data.propertyPhotos,
  };
};