package app

import (
	"log"

	"github.com/saneechka/ManageSubscription/internal/models"
)

// SeedPopularSubscriptions adds popular subscription services to the database if they don't exist
func SeedPopularSubscriptions() {
	log.Println("Инициализация данных популярных подписок...")

	// Список популярных сервисов с месячными подписками
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

	// Годовые версии популярных подписок (со скидкой ~20%)
	yearlyServices := []models.Plan{
		{
			Name:        "Яндекс Плюс",
			Description: "Годовой доступ к Яндекс Музыке, скидки на такси и доставку, кешбэк в сервисах Яндекса",
			Price:       2990, // Скидка ~20% на год
			Duration:    1,
			PeriodType:  "years",
			Features:    "Музыка без рекламы, скидки на такси, кешбэк баллами, фильмы и сериалы",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "yandex_plus.png",
			ServiceType: "bundle",
			ServiceURL:  "https://plus.yandex.ru",
		},
		{
			Name:        "Netflix Стандарт",
			Description: "Годовой доступ к популярному стриминговому сервису с широким выбором фильмов и сериалов",
			Price:       6699, // Годовая цена со скидкой
			Duration:    1,
			PeriodType:  "years",
			Features:    "HD-качество, доступ к полной библиотеке контента, экономия при годовой оплате",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "netflix.png",
			ServiceType: "streaming",
			ServiceURL:  "https://netflix.com",
		},
		{
			Name:        "Spotify Premium",
			Description: "Годовой доступ к музыкальному сервису с миллионами треков и подкастами",
			Price:       1899, // Годовая цена со скидкой
			Duration:    1,
			PeriodType:  "years",
			Features:    "Музыка без рекламы, загрузка для офлайн прослушивания, высокое качество аудио, экономия при годовой оплате",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "spotify.png",
			ServiceType: "music",
			ServiceURL:  "https://spotify.com",
		},
		{
			Name:        "Google One 100GB",
			Description: "Годовой доступ к облачному хранилищу Google с дополнительным пространством",
			Price:       1390, // Годовая цена со скидкой
			Duration:    1,
			PeriodType:  "years",
			Features:    "100 ГБ облачного хранилища, доступ с любого устройства, расширенная поддержка, экономия при годовой оплате",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "google_one.png",
			ServiceType: "cloud",
			ServiceURL:  "https://one.google.com",
		},
		{
			Name:        "YouTube Premium",
			Description: "Годовой доступ к YouTube без рекламы с дополнительными функциями",
			Price:       3290, // Годовая цена со скидкой
			Duration:    1,
			PeriodType:  "years",
			Features:    "Просмотр без рекламы, фоновое воспроизведение, загрузка видео, доступ к YouTube Music, экономия при годовой оплате",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "youtube_premium.png",
			ServiceType: "streaming",
			ServiceURL:  "https://youtube.com/premium",
		},
		{
			Name:        "Apple Music",
			Description: "Годовой доступ к музыкальному стриминговому сервису от Apple",
			Price:       1690, // Годовая цена со скидкой
			Duration:    1,
			PeriodType:  "years",
			Features:    "Более 75 миллионов песен, персональные рекомендации, живые радиостанции, экономия при годовой оплате",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "apple_music.png",
			ServiceType: "music",
			ServiceURL:  "https://apple.com/apple-music",
		},
		{
			Name:        "Кинопоиск HD",
			Description: "Годовой доступ к российскому стриминговому сервису с фильмами и сериалами",
			Price:       2590, // Годовая цена со скидкой
			Duration:    1,
			PeriodType:  "years",
			Features:    "Эксклюзивные и премьерные фильмы и сериалы, без рекламы, экономия при годовой оплате",
			IsPopular:   true,
			IsActive:    true,
			ServiceIcon: "kinopoisk.png",
			ServiceType: "streaming",
			ServiceURL:  "https://hd.kinopoisk.ru",
		},
	}

	// Объединяем месячные и годовые планы для добавления
	allPlans := append(popularServices, yearlyServices...)

	// Добавляем каждый сервис, если он ещё не существует
	for _, service := range allPlans {
		var existingService models.Plan
		// Ищем по имени, длительности и типу периода
		result := DB.Where("name = ? AND duration = ? AND period_type = ?",
			service.Name, service.Duration, service.PeriodType).First(&existingService)

		// Если сервис не существует, добавляем его
		if result.Error != nil {
			if err := DB.Create(&service).Error; err != nil {
				log.Printf("Ошибка при добавлении сервиса %s (%s): %v", service.Name, service.PeriodType, err)
			} else {
				log.Printf("Добавлен новый сервис: %s (%s)", service.Name, service.PeriodType)
			}
		}
	}

	log.Println("Инициализация данных популярных подписок завершена")
}
