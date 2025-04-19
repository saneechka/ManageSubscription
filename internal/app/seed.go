package app

import (
	"log"

	"github.com/saneechka/ManageSubscription/internal/models"
)

// SeedPopularSubscriptions adds popular subscription services to the database if they don't exist
func SeedPopularSubscriptions() {
	log.Println("Инициализация данных популярных ежемесячных подписок...")

	
	// Список популярных сервисов с подписками
	popularServices := []models.Plan{
		{
			Name:        "Яндекс Плюс",
			Description: "Доступ к Яндекс Музыке, скидки на такси и доставку, кешбэк в сервисах Яндекса",
			Price:       299,
			Duration:    1,
			PeriodType:  "months",
			Features:    "Музыка без рекламы, скидки на такси, кешбэк баллами, фильмы и сериалы",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "yandex_plus.png",
			ServiceType: "bundle",
			ServiceURL:  "https://plus.yandex.ru",
		},
		{
			Name:        "Netflix Стандарт",
			Description: "Популярный стриминговый сервис с широким выбором фильмов, сериалов и шоу",
			Price:       699,
			Duration:    1,
			PeriodType:  "months",
			Features:    "HD-качество, доступ к полной библиотеке контента",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "netflix.png",
			ServiceType: "streaming",
			ServiceURL:  "https://netflix.com",
		},
		{
			Name:        "Spotify Premium",
			Description: "Музыкальный сервис с миллионами треков, подкастами и плейлистами",
			Price:       199,
			Duration:    1,
			PeriodType:  "months",
			Features:    "Музыка без рекламы, загрузка для офлайн прослушивания, высокое качество аудио",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "spotify.png",
			ServiceType: "music",
			ServiceURL:  "https://spotify.com",
		},
		{
			Name:        "Google One 100GB",
			Description: "Облачное хранилище Google с дополнительным пространством для фото и файлов",
			Price:       139,
			Duration:    1,
			PeriodType:  "months",
			Features:    "100 ГБ облачного хранилища, доступ с любого устройства, расширенная поддержка",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "google_one.png",
			ServiceType: "cloud",
			ServiceURL:  "https://one.google.com",
		},
		{
			Name:        "YouTube Premium",
			Description: "YouTube без рекламы с дополнительными функциями",
			Price:       329,
			Duration:    1,
			PeriodType:  "months",
			Features:    "Просмотр без рекламы, фоновое воспроизведение, загрузка видео, доступ к YouTube Music",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "youtube_premium.png",
			ServiceType: "streaming",
			ServiceURL:  "https://youtube.com/premium",
		},
		{
			Name:        "Apple Music",
			Description: "Музыкальный стриминговый сервис от Apple",
			Price:       169,
			Duration:    1,
			PeriodType:  "months",
			Features:    "Более 75 миллионов песен, персональные рекомендации, живые радиостанции",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "apple_music.png",
			ServiceType: "music",
			ServiceURL:  "https://apple.com/apple-music",
		},
		{
			Name:        "iCloud+ 50GB",
			Description: "Облачное хранилище для устройств Apple",
			Price:       79,
			Duration:    1,
			PeriodType:  "months",
			Features:    "50 ГБ облачного хранилища, резервное копирование, iCloud Private Relay",
			IsPopular:   false,
			IsActive:    true,
			ServiceIcon: "icloud.png",
			ServiceType: "cloud",
			ServiceURL:  "https://apple.com/icloud",
		},
		{
			Name:        "Microsoft 365 Персональный",
			Description: "Набор офисных приложений и облачное хранилище",
			Price:       399,
			Duration:    1,
			PeriodType:  "months",
			Features:    "Word, Excel, PowerPoint, 1 ТБ OneDrive, Outlook",
			IsPopular:   false,
			IsActive:    true,
			ServiceIcon: "microsoft_365.png",
			ServiceType: "productivity",
			ServiceURL:  "https://microsoft.com/microsoft-365",
		},
		{
			Name:        "Кинопоиск HD",
			Description: "Российский стриминговый сервис с фильмами и сериалами",
			Price:       269,
			Duration:    1,
			PeriodType:  "months",
			Features:    "Эксклюзивные и премьерные фильмы и сериалы, без рекламы",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "kinopoisk.png",
			ServiceType: "streaming",
			ServiceURL:  "https://hd.kinopoisk.ru",
		},
		{
			Name:        "СберПрайм",
			Description: "Подписка на сервисы экосистемы Сбера",
			Price:       199,
			Duration:    1,
			PeriodType:  "months",
			Features:    "Бесплатная доставка Сбермаркет, скидки на такси, кешбэк",
			IsPopular:   false,
			IsActive:    true,
			ServiceIcon: "sber_prime.png",
			ServiceType: "bundle",
			ServiceURL:  "https://sberprime.sber.ru",
		},
	}

	// Добавляем каждый сервис, если он ещё не существует
	for _, service := range popularServices {
		var existingService models.Plan
		result := DB.Where("name = ?", service.Name).First(&existingService)

		// Если сервис не существует, добавляем его
		if result.Error != nil {
			if err := DB.Create(&service).Error; err != nil {
				log.Printf("Ошибка при добавлении сервиса %s: %v", service.Name, err)
			} else {
				log.Printf("Добавлен новый сервис: %s", service.Name)
			}
		}
	}

	log.Println("Инициализация данных популярных подписок завершена")
}
