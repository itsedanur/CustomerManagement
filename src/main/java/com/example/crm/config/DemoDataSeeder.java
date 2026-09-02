package com.example.crm.config;

import com.example.crm.activity.entity.Activity;
import com.example.crm.activity.entity.ActivityType;
import com.example.crm.activity.repository.ActivityRepository;
import com.example.crm.address.entity.Address;
import com.example.crm.address.entity.AddressType;
import com.example.crm.address.repository.AddressRepository;
import com.example.crm.audit.entity.AuditLog;
import com.example.crm.audit.repository.AuditLogRepository;
import com.example.crm.customer.entity.Customer;
import com.example.crm.customer.entity.CustomerStatus;
import com.example.crm.customer.entity.CustomerType;
import com.example.crm.customer.repository.CustomerRepository;
import com.example.crm.ticket.entity.Ticket;
import com.example.crm.ticket.entity.TicketPriority;
import com.example.crm.ticket.entity.TicketStatus;
import com.example.crm.ticket.repository.TicketRepository;
import com.example.crm.user.entity.User;
import com.example.crm.user.entity.UserRole;
import com.example.crm.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Random;

@Component
@Profile({"dev", "demo", "default"})
@RequiredArgsConstructor
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final AddressRepository addressRepository;
    private final TicketRepository ticketRepository;
    private final ActivityRepository activityRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (customerRepository.count() > 5) {
            logger.info("Database already contains demo dataset ({} customers). Skipping seeding.", customerRepository.count());
            return;
        }

        logger.info("Seeding Phase 13 realistic CRM demo dataset...");

        // 1. Seed Users (Representatives)
        List<User> users = seedUsers();

        // 2. Seed 45 Customers
        List<Customer> customers = seedCustomers();

        // 3. Seed Addresses for Customers
        seedAddresses(customers);

        // 4. Seed 30 Support Tickets
        List<Ticket> tickets = seedTickets(customers, users);

        // 5. Seed Activities & Audit Logs
        seedActivitiesAndAuditLogs(customers, tickets, users);

        logger.info("Successfully seeded Phase 13 dataset: {} Users, {} Customers, {} Tickets.",
                users.size(), customers.size(), tickets.size());
    }

    private List<User> seedUsers() {
        List<User> users = new ArrayList<>();

        User admin = userRepository.findByEmail("admin@example.com").orElse(null);
        if (admin == null) {
            admin = User.builder()
                    .firstName("System")
                    .lastName("Admin")
                    .email("admin@example.com")
                    .passwordHash(passwordEncoder.encode("admin"))
                    .role(UserRole.ADMIN)
                    .enabled(true)
                    .build();
            admin = userRepository.save(admin);
        }
        users.add(admin);

        Object[][] userData = {
                {"Ayşe", "Kaya", "ayse.kaya@crm.local", UserRole.MANAGER},
                {"Mert", "Demir", "mert.demir@crm.local", UserRole.AGENT},
                {"Selin", "Arslan", "selin.arslan@crm.local", UserRole.AGENT},
                {"Can", "Öztürk", "can.ozturk@crm.local", UserRole.AGENT},
                {"Elif", "Yıldız", "elif.yildiz@crm.local", UserRole.AGENT}
        };

        for (Object[] u : userData) {
            String email = (String) u[2];
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                user = User.builder()
                        .firstName((String) u[0])
                        .lastName((String) u[1])
                        .email(email)
                        .passwordHash(passwordEncoder.encode("Password123!"))
                        .role((UserRole) u[3])
                        .enabled(true)
                        .build();
                user = userRepository.save(user);
            }
            users.add(user);
        }

        return users;
    }

    private List<Customer> seedCustomers() {
        List<Customer> customers = new ArrayList<>();

        String[] firstNames = {
                "Ahmet", "Zeynep", "Mehmet", "Elif", "Burak", "Selin", "Emre", "Ceren", "Can", "Derya",
                "Mert", "İrem", "Kerem", "Buse", "Onur", "Alperen", "Nazlı", "Tarık", "Gizem", "Yasin",
                "Sibel", "Volkan", "Damla", "Oğuzhan", "Esra", "Kadir", "Melis", "Enes", "Hilal", "Umut",
                "Bahar", "Serkan", "Gamze", "Tolga", "Aylin", "Deniz", "Tuğba", "Ege", "Nisa", "Kaan",
                "Sinem", "Koray", "Ezgi", "Barış", "Pınar"
        };

        String[] lastNames = {
                "Yılmaz", "Kaya", "Demir", "Aydın", "Şahin", "Arslan", "Koç", "Yıldız", "Öztürk", "Çelik",
                "Aksoy", "Kurt", "Yalçın", "Erdoğan", "Kılıç", "Bulut", "Tekin", "Doğan", "Aslan", "Karaca",
                "Polat", "Tunç", "Yavuz", "Şen", "Güneş", "Acar", "Varol", "Korkmaz", "Taş", "Şimşek",
                "Özdemir", "Çakır", "Bozkurt", "Özcan", "Özer", "Gürbüz", "Keskin", "Ünal", "Gül", "Avcı",
                "Alkan", "Sarı", "Yücel", "Soner", "Yıldırım"
        };

        String[] corporateCompanies = {
                "Atlas Otomotiv A.Ş.", "Nova Yazılım", "Mavi Lojistik", "Pera Danışmanlık", "Artemis Teknoloji",
                "Vega Enerji", "Marmara Bilişim", "Kuzey Lojistik", "Anka Dijital", "Rota Teknoloji",
                "Delta Endüstri", "Luna E-Ticaret", "Vizyon Medya", "Pars Savunma", "Kanyon Yapı",
                "Meridyen Gıda", "Sentez Kimya", "Ege Tekstil", "Doğuş Ambalaj", "Zirve Metal"
        };

        Random random = new Random(42);
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < 45; i++) {
            String fn = firstNames[i % firstNames.length];
            String ln = lastNames[i % lastNames.length];
            boolean isCorporate = (i % 3 == 0);

            CustomerType type = isCorporate ? CustomerType.CORPORATE : CustomerType.INDIVIDUAL;
            String company = isCorporate ? corporateCompanies[(i / 3) % corporateCompanies.length] : fn + " " + ln + " Bireysel";

            // Status Distribution: ~70% ACTIVE, ~20% INACTIVE, ~10% BLOCKED
            CustomerStatus status;
            if (i % 10 == 9) {
                status = CustomerStatus.BLOCKED;
            } else if (i % 5 == 3) {
                status = CustomerStatus.INACTIVE;
            } else {
                status = CustomerStatus.ACTIVE;
            }

            int daysAgo = random.nextInt(180) + 1; // last 6 months
            LocalDateTime createdAt = now.minusDays(daysAgo).minusHours(random.nextInt(12)).minusMinutes(random.nextInt(60));

            String email = fn.toLowerCase(Locale.ENGLISH) + "." + ln.toLowerCase(Locale.ENGLISH) + (i + 1) + "@example.com";
            String phone = "+90 5" + (30 + random.nextInt(6)) + " " + String.format("%03d %04d", random.nextInt(1000), random.nextInt(10000));

            Customer customer = Customer.builder()
                    .firstName(fn)
                    .lastName(ln)
                    .email(email)
                    .phone(phone)
                    .company(company)
                    .customerType(type)
                    .status(status)
                    .createdAt(createdAt)
                    .updatedAt(createdAt)
                    .build();

            customers.add(customerRepository.save(customer));
        }

        return customers;
    }

    private void seedAddresses(List<Customer> customers) {
        String[] cities = {"İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Kocaeli", "Adana", "Gaziantep", "Eskişehir", "Konya"};
        String[] districts = {"Kadıköy", "Çankaya", "Konak", "Nilüfer", "Muratpaşa", "Gebze", "Seyhan", "Şahinbey", "Tepebaşı", "Selçuklu"};
        String[] titles = {"Merkez Ofis", "Depo / Lojistik", "Fatura Adresi", "Ev Adresi", "Şube"};

        for (int i = 0; i < customers.size(); i++) {
            Customer customer = customers.get(i);
            int idx = i % cities.length;

            Address primary = Address.builder()
                    .title(titles[i % titles.length])
                    .country("Türkiye")
                    .city(cities[idx])
                    .district(districts[idx])
                    .addressLine(districts[idx] + " Mah. Barbaros Cad. No:" + (i + 10) + " D:" + (i % 8 + 1))
                    .postalCode(String.format("%05d", 34000 + i * 12))
                    .addressType(AddressType.WORK)
                    .customer(customer)
                    .build();

            addressRepository.save(primary);

            if (customer.getCustomerType() == CustomerType.CORPORATE) {
                Address secondary = Address.builder()
                        .title("Depo / Şube")
                        .country("Türkiye")
                        .city(cities[(idx + 2) % cities.length])
                        .district(districts[(idx + 2) % districts.length])
                        .addressLine("Organize Sanayi Bölgesi 4. Cad. No:" + (i + 50))
                        .postalCode(String.format("%05d", 41000 + i * 15))
                        .addressType(AddressType.SHIPPING)
                        .customer(customer)
                        .build();

                addressRepository.save(secondary);
            }
        }
    }

    private List<Ticket> seedTickets(List<Customer> customers, List<User> users) {
        List<Ticket> tickets = new ArrayList<>();

        String[] subjects = {
                "Hesaba giriş yapamıyorum",
                "Fatura görüntülenemiyor",
                "Kullanıcı yetkilendirme talebi",
                "Entegrasyon bağlantı hatası",
                "Sipariş durumu güncellenmiyor",
                "E-posta bildirimleri ulaşmıyor",
                "Şifre sıfırlama bağlantısı çalışmıyor",
                "Rapor ekranında veri görünmüyor",
                "Hesap bilgileri güncellenemiyor",
                "API erişim problemi",
                "Kullanıcı hesabı kilitlendi",
                "Yanlış fatura bilgisi",
                "Performans problemi",
                "Veri aktarımı tamamlanmıyor",
                "Yeni kullanıcı yetkisi talebi",
                "Ödeme servisi zaman aşımı hatası",
                "Mobil uygulama bildirim sorunu",
                "Stok senkronizasyon gecikmesi",
                "Dış sistem webhook hatası",
                "SSL sertifikası güncelleme uyarısı",
                "Çoklu oturum çakışması",
                "PDF çıktı alma hatası",
                "Arama filtreleri çalışmıyor",
                "Otomatik e-posta şablonu hatası",
                "Excel dışa aktarım kesintisi",
                "Yetki matrisi uyuşmazlığı",
                "Veritabanı bağlantı havuzu uyarısı",
                "Kullanıcı profil fotoğrafı yüklenemiyor",
                "Zaman dilimi uyumsuzluğu",
                "Toplu fatura aktarımında kesinti"
        };

        TicketStatus[] statuses = {
                TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED,
                TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.OPEN, TicketStatus.RESOLVED
        };

        TicketPriority[] priorities = {
                TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.CRITICAL,
                TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.CRITICAL, TicketPriority.MEDIUM
        };

        Random random = new Random(88);
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < 30; i++) {
            Customer customer = customers.get(i % customers.size());
            User assignedUser = users.get((i % (users.size() - 1)) + 1);

            TicketStatus status = statuses[i % statuses.length];
            TicketPriority priority = priorities[i % priorities.length];

            int daysAgo = random.nextInt(45);
            LocalDateTime createdAt = now.minusDays(daysAgo).minusHours(random.nextInt(10)).minusMinutes(random.nextInt(50));
            LocalDateTime updatedAt = (status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED)
                    ? createdAt.plusHours(random.nextInt(36) + 1)
                    : createdAt.plusMinutes(random.nextInt(120));

            String ticketNumber = String.format("CRM-2026-%06d", i + 101);

            Ticket ticket = Ticket.builder()
                    .ticketNumber(ticketNumber)
                    .subject(subjects[i % subjects.length])
                    .description(subjects[i % subjects.length] + " ile ilgili destek talebi oluşturuldu. İnceleme başlatıldı.")
                    .status(status)
                    .priority(priority)
                    .customer(customer)
                    .assignedUser(assignedUser)
                    .createdAt(createdAt)
                    .updatedAt(updatedAt)
                    .build();

            tickets.add(ticketRepository.save(ticket));
        }

        return tickets;
    }

    private void seedActivitiesAndAuditLogs(List<Customer> customers, List<Ticket> tickets, List<User> users) {
        Random random = new Random(77);

        // Seed Activity Timeline Entries
        for (int i = 0; i < 40; i++) {
            Customer customer = customers.get(i % customers.size());
            User user = users.get(i % users.size());
            Ticket ticket = tickets.get(i % tickets.size());

            ActivityType type;
            String desc;
            if (i % 4 == 0) {
                type = ActivityType.TICKET_CREATED;
                desc = "Destek talebi oluşturuldu: " + ticket.getTicketNumber();
            } else if (i % 4 == 1) {
                type = ActivityType.TICKET_ASSIGNED;
                desc = ticket.getTicketNumber() + " talebi " + user.getFirstName() + " " + user.getLastName() + " kullanıcısına atandı";
            } else if (i % 4 == 2) {
                type = ActivityType.TICKET_STATUS_CHANGED;
                desc = ticket.getTicketNumber() + " talebinin durumu güncellendi";
            } else {
                type = ActivityType.CUSTOMER_UPDATED;
                desc = "Müşteri iletişim bilgileri doğrulandı";
            }

            LocalDateTime time = LocalDateTime.now().minusDays(random.nextInt(30)).minusHours(random.nextInt(12));

            Activity activity = Activity.builder()
                    .customer(customer)
                    .performedBy(user)
                    .type(type)
                    .entityId(ticket.getId())
                    .description(desc)
                    .createdAt(time)
                    .build();

            activityRepository.save(activity);
        }

        // Seed System Audit Logs
        String[] actions = {
                "LOGIN", "CUSTOMER_CREATE", "CUSTOMER_UPDATE", "TICKET_CREATE",
                "TICKET_ASSIGN", "TICKET_STATUS_CHANGE", "USER_ROLE_CHANGE"
        };

        for (int i = 0; i < 35; i++) {
            User user = users.get(i % users.size());
            String action = actions[i % actions.length];

            LocalDateTime time = LocalDateTime.now().minusDays(random.nextInt(30)).minusHours(random.nextInt(10));

            AuditLog log = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .entityType(i % 2 == 0 ? "Customer" : "Ticket")
                    .entityId(String.valueOf(i + 10))
                    .ipAddress("192.168.1." + (10 + (i % 50)))
                    .details("Sistem işlem kaydı #" + (i + 1000) + " - " + action)
                    .createdAt(time)
                    .build();

            auditLogRepository.save(log);
        }
    }
}
