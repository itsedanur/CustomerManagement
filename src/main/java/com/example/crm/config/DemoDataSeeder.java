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
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Random;

import com.example.crm.customer.entity.CustomerNote;
import com.example.crm.customer.repository.CustomerNoteRepository;
import com.example.crm.notification.entity.Notification;
import com.example.crm.notification.repository.NotificationRepository;
import com.example.crm.task.entity.CrmTask;
import com.example.crm.task.entity.TaskPriority;
import com.example.crm.task.entity.TaskStatus;
import com.example.crm.task.repository.CrmTaskRepository;
import com.example.crm.ticket.entity.TicketNote;
import com.example.crm.ticket.repository.TicketNoteRepository;

@Component
@Profile({"dev", "demo", "default"})
@ConditionalOnProperty(name = "crm.demo-data.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final AddressRepository addressRepository;
    private final TicketRepository ticketRepository;
    private final ActivityRepository activityRepository;
    private final AuditLogRepository auditLogRepository;
    private final CustomerNoteRepository customerNoteRepository;
    private final TicketNoteRepository ticketNoteRepository;
    private final CrmTaskRepository crmTaskRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        logger.info("Checking Phase 14.1 CRM demo dataset seeding status...");

        // 1. Seed Users (Representatives)
        List<User> users = seedUsers();

        // 2. Seed 45 Customers with 6-month realistic creation date distribution
        List<Customer> customers = seedCustomers();

        // 3. Seed Addresses for Customers
        seedAddresses(customers);

        // 4. Seed 30 Support Tickets with realistic 60-day distribution (including 2 today)
        List<Ticket> tickets = seedTickets(customers, users);

        // 5. Seed Activities & Audit Logs
        seedActivitiesAndAuditLogs(customers, tickets, users);

        // 6. Seed Customer Notes
        seedCustomerNotes(customers, users);

        // 7. Seed Ticket Notes
        seedTicketNotes(tickets, users);

        // 8. Seed CRM Tasks (Overdue, Due Today, Future)
        seedTasks(customers, tickets, users);

        // 9. Seed Notifications
        seedNotifications(users, tickets);

        logger.info("DemoDataSeeder check completed. Total in DB: {} Users, {} Customers, {} Tickets, {} Tasks, {} Customer Notes, {} Ticket Notes.",
                userRepository.count(), customerRepository.count(), ticketRepository.count(),
                crmTaskRepository.count(), customerNoteRepository.count(), ticketNoteRepository.count());
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
                "Delta Endüstri", "Luna E-Ticaret", "Vizyon Medya", "Pars Savunma", "Kanyon Yapı"
        };

        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < 45; i++) {
            String fn = firstNames[i % firstNames.length];
            String ln = lastNames[i % lastNames.length];
            boolean isCorporate = (i % 3 == 0);

            CustomerType type = isCorporate ? CustomerType.CORPORATE : CustomerType.INDIVIDUAL;
            String company = isCorporate ? corporateCompanies[(i / 3) % corporateCompanies.length] : fn + " " + ln + " Bireysel";

            CustomerStatus status;
            if (i % 15 == 14) {
                status = CustomerStatus.BLOCKED;
            } else if (i % 7 == 6) {
                status = CustomerStatus.INACTIVE;
            } else {
                status = CustomerStatus.ACTIVE;
            }

            // Distribute registration smoothly across last 180 days (6 months)
            // i = 0..44 -> 175 days ago down to 2 days ago
            int daysAgo = 175 - (i * 170 / 44); 
            LocalDateTime createdAt = now.minusDays(daysAgo).minusHours(i % 12).minusMinutes((i * 13) % 60);

            String email = fn.toLowerCase(Locale.ENGLISH) + "." + ln.toLowerCase(Locale.ENGLISH) + (i + 1) + "@example.com";
            String phone = "+90 5" + (30 + (i % 6)) + " " + String.format("%03d %04d", (i * 23) % 1000, (i * 157) % 10000);

            Customer customer = customerRepository.findByEmail(email).orElse(null);
            if (customer == null) {
                customer = Customer.builder()
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
                customer = customerRepository.save(customer);
            }
            customers.add(customer);
        }

        return customers;
    }

    private void seedAddresses(List<Customer> customers) {
        String[] cities = {"İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Kocaeli", "Adana", "Gaziantep", "Eskişehir", "Konya"};
        String[] districts = {"Kadıköy", "Çankaya", "Konak", "Nilüfer", "Muratpaşa", "Gebze", "Seyhan", "Şahinbey", "Tepebaşı", "Selçuklu"};
        String[] titles = {"Merkez Ofis", "Depo / Lojistik", "Fatura Adresi", "Ev Adresi", "Şube"};

        for (int i = 0; i < customers.size(); i++) {
            Customer customer = customers.get(i);
            if (!addressRepository.findAllByCustomer_Id(customer.getId()).isEmpty()) {
                continue;
            }

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

        // Distribution of statuses: 11 OPEN, 8 IN_PROGRESS, 7 RESOLVED, 4 CLOSED
        TicketStatus[] statuses = {
                TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.OPEN, TicketStatus.RESOLVED,
                TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CLOSED, TicketStatus.RESOLVED,
                TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.OPEN, TicketStatus.RESOLVED,
                TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CLOSED, TicketStatus.OPEN,
                TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED,
                TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.OPEN, TicketStatus.RESOLVED,
                TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED,
                TicketStatus.OPEN, TicketStatus.IN_PROGRESS
        };

        // Priorities: 5 LOW, 12 MEDIUM, 8 HIGH, 5 CRITICAL
        TicketPriority[] priorities = {
                TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.LOW, TicketPriority.CRITICAL,
                TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.MEDIUM, TicketPriority.LOW,
                TicketPriority.CRITICAL, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.MEDIUM,
                TicketPriority.LOW, TicketPriority.CRITICAL, TicketPriority.MEDIUM, TicketPriority.HIGH,
                TicketPriority.MEDIUM, TicketPriority.LOW, TicketPriority.CRITICAL, TicketPriority.HIGH,
                TicketPriority.MEDIUM, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.LOW,
                TicketPriority.CRITICAL, TicketPriority.HIGH, TicketPriority.MEDIUM, TicketPriority.MEDIUM,
                TicketPriority.HIGH, TicketPriority.MEDIUM
        };

        LocalDateTime now = LocalDateTime.now();

        // 30 tickets created over last 60 days.
        // Index 0 and 1 are created TODAY (0 days ago) for realistic "Bugün açılan: 2" KPI!
        for (int i = 0; i < 30; i++) {
            Customer customer = customers.get(i % customers.size());
            User assignedUser = users.get((i % (users.size() - 1)) + 1);

            TicketStatus status = statuses[i];
            TicketPriority priority = priorities[i];

            int daysAgo;
            if (i == 0) {
                daysAgo = 0; // Opened 2 hours ago today
            } else if (i == 1) {
                daysAgo = 0; // Opened 4 hours ago today
            } else {
                // Distribute evenly 1 to 58 days ago
                daysAgo = 1 + (i * 57 / 28);
            }

            LocalDateTime createdAt = (daysAgo == 0) 
                    ? now.minusHours(2 + i * 2) 
                    : now.minusDays(daysAgo).minusHours((i * 3) % 12).minusMinutes((i * 17) % 60);

            LocalDateTime updatedAt;
            if (status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED) {
                // Resolved in 2 to 6 hours for realistic average resolution time (~4.2 hours)
                updatedAt = createdAt.plusHours(2 + (i % 5));
            } else {
                updatedAt = createdAt.plusMinutes(15 + (i * 10));
            }

            String ticketNumber = String.format("CRM-2026-%06d", i + 101);

            Ticket ticket = ticketRepository.findByTicketNumber(ticketNumber).orElse(null);
            if (ticket == null) {
                ticket = Ticket.builder()
                        .ticketNumber(ticketNumber)
                        .subject(subjects[i])
                        .description(subjects[i] + " ile ilgili teknik destek talebi açılmıştır. Temsilci incelemesindedir.")
                        .status(status)
                        .priority(priority)
                        .customer(customer)
                        .assignedUser(assignedUser)
                        .createdAt(createdAt)
                        .updatedAt(updatedAt)
                        .build();
                ticket = ticketRepository.save(ticket);
            }
            tickets.add(ticket);
        }

        return tickets;
    }

    private void seedActivitiesAndAuditLogs(List<Customer> customers, List<Ticket> tickets, List<User> users) {
        if (activityRepository.count() < 30) {
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

                LocalDateTime time = ticket.getCreatedAt().plusMinutes((i * 25) % 300);

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
        }

        if (auditLogRepository.count() < 30) {
            String[] actions = {
                    "LOGIN", "CUSTOMER_CREATE", "CUSTOMER_UPDATE", "TICKET_CREATE",
                    "TICKET_ASSIGN", "TICKET_STATUS_CHANGE", "USER_ROLE_CHANGE"
            };

            for (int i = 0; i < 35; i++) {
                User user = users.get(i % users.size());
                String action = actions[i % actions.length];

                LocalDateTime time = LocalDateTime.now().minusDays(i * 3 + 1).minusHours(i % 10);

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

    private void seedCustomerNotes(List<Customer> customers, List<User> users) {
        if (customerNoteRepository.count() >= 20) return;

        String[] noteContents = {
                "Müşteri yeni entegrasyon paketi hakkında bilgi istedi.",
                "Yıllık lisans yenileme sözleşmesi gönderildi, geri dönüş bekleniyor.",
                "Müşteri temsilcisi değişikliği talep edildi.",
                "Ödeme planı revize edildi, 3 taksit olarak güncellendi.",
                "API erişim anahtarları sıfırlandı ve teknik ekibe iletildi.",
                "VIP müşteri statüsüne yükseltildi, öncelikli destek tanımlandı.",
                "Mobil uygulama erişim sorunu çözüldü, müşteri onayladı.",
                "Fatura adresi güncellendi, yeni merkez ofis bilgileri kaydedildi.",
                "Müşteri şikayeti çözüme kavuşturuldu, memnuniyet anketi iletildi.",
                "Kurumsal hesap yöneticisi ile toplantı yapıldı."
        };

        for (int i = 0; i < 20; i++) {
            Customer customer = customers.get(i % customers.size());
            User author = users.get((i % (users.size() - 1)) + 1);

            LocalDateTime time = customer.getCreatedAt().plusDays(i % 5 + 1);

            CustomerNote note = CustomerNote.builder()
                    .customer(customer)
                    .authorUser(author)
                    .content(noteContents[i % noteContents.length])
                    .createdAt(time)
                    .updatedAt(time)
                    .build();

            customerNoteRepository.save(note);
        }
    }

    private void seedTicketNotes(List<Ticket> tickets, List<User> users) {
        if (ticketNoteRepository.count() >= 20) return;

        String[] ticketNoteContents = {
                "Müşteri ile telefon görüşmesi yapıldı. Log dosyaları e-posta ile istendi.",
                "Yazılım geliştirme ekibine hata bildirimi (JIRA-4021) açıldı.",
                "Veritabanı bağlantı zaman aşımı süresi artırıldı, gözlemleniyor.",
                "SSL sertifikası yenilendi ve Nginx sunucusunda aktif edildi.",
                "Kullanıcı yetki matrisi kontrol edildi, eksik rol tanımlandı.",
                "Ödeme entegrasyonu test ortamında başarılı oldu.",
                "Müşteri tarafındaki güvenlik duvarı kuralı güncellendi.",
                "Sorunun çözümü için alternatif geçici çözüm sağlandı."
        };

        for (int i = 0; i < 20; i++) {
            Ticket ticket = tickets.get(i % tickets.size());
            User author = users.get(i % users.size());

            LocalDateTime time = ticket.getCreatedAt().plusMinutes(30 + i * 15);

            TicketNote note = TicketNote.builder()
                    .ticket(ticket)
                    .authorUser(author)
                    .content(ticketNoteContents[i % ticketNoteContents.length])
                    .createdAt(time)
                    .updatedAt(time)
                    .build();

            ticketNoteRepository.save(note);
        }
    }

    private void seedTasks(List<Customer> customers, List<Ticket> tickets, List<User> users) {
        if (crmTaskRepository.count() >= 25) return;

        String[] taskTitles = {
                "Müşteri ile sözleşme detaylarını görüş",
                "Fatura hatasını incele ve finans ekibine bildir",
                "CRM entegrasyon ayarlarını kontrol et",
                "Yeni kullanıcı yetkilendirme talebini tamamla",
                "Haftalık destek raporunu hazırla",
                "Geciken bilet için müşteriyle iletişime geç",
                "Stok senkronizasyon servisini yeniden başlat",
                "Mobil bildirim altyapısını test et",
                "VIP müşteri için özel destek planı hazırla",
                "Kullanıcı eğitim dokümanını güncelle"
        };

        TaskPriority[] priorities = {TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.CRITICAL};
        TaskStatus[] statuses = {TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.TODO, TaskStatus.IN_PROGRESS};

        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < 25; i++) {
            Customer customer = (i % 2 == 0) ? customers.get(i % customers.size()) : null;
            Ticket ticket = (i % 3 == 0) ? tickets.get(i % tickets.size()) : null;

            User assignedUser = users.get(i % users.size());
            User createdByUser = users.get((i + 1) % users.size());

            TaskPriority priority = priorities[i % priorities.length];
            TaskStatus status = statuses[i % statuses.length];

            LocalDateTime dueDate;
            if (i < 4) {
                // Due TODAY for "Bugünkü Görevlerim"
                dueDate = now.withHour(17).withMinute(0);
            } else if (i < 7) {
                // OVERDUE for warning banner
                dueDate = now.minusDays(i - 3);
            } else {
                // Future dates
                dueDate = now.plusDays(i - 5);
            }

            LocalDateTime createdAt = dueDate.minusDays(3);

            CrmTask task = CrmTask.builder()
                    .title(taskTitles[i % taskTitles.length] + " #" + (i + 1))
                    .description("Görevin detaylı açıklaması ve operasyonel adımları buradadır.")
                    .customer(customer)
                    .ticket(ticket)
                    .assignedUser(assignedUser)
                    .createdByUser(createdByUser)
                    .dueDate(dueDate)
                    .priority(priority)
                    .status(status)
                    .createdAt(createdAt)
                    .updatedAt(createdAt)
                    .completedAt(status == TaskStatus.COMPLETED ? createdAt.plusHours(12) : null)
                    .build();

            crmTaskRepository.save(task);
        }
    }

    private void seedNotifications(List<User> users, List<Ticket> tickets) {
        if (notificationRepository.count() >= 10) return;

        for (int i = 0; i < 12; i++) {
            User recipient = users.get(i % users.size());
            Ticket ticket = tickets.get(i % tickets.size());

            boolean isRead = (i % 3 == 0);

            Notification notification = Notification.builder()
                    .user(recipient)
                    .title(i % 2 == 0 ? "Yeni Destek Talebi Atandı" : "Görev Son Tarihi Yaklaşıyor")
                    .message(i % 2 == 0 ? ticket.getTicketNumber() + " numaralı destek talebi size atandı." : "Size atanan operasyonel görevin son günü bugün.")
                    .read(isRead)
                    .targetUrl(i % 2 == 0 ? "/tickets/" + ticket.getId() : "/tasks")
                    .createdAt(LocalDateTime.now().minusHours(i * 3 + 1))
                    .build();

            notificationRepository.save(notification);
        }
    }
}
