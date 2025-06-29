import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-landing',
  templateUrl: './client-landing.component.html',
  styleUrls: ['./client-landing.component.css']
})
export class ClientLandingComponent implements OnInit, AfterViewInit {
  @ViewChild('heroSection', { static: false }) heroSection!: ElementRef;

  services = [
    {
      icon: 'fas fa-shield-alt',
      title: 'Maintenance Préventive',
      description: 'Programmes de maintenance régulière pour éviter les pannes et optimiser les performances',
      color: 'linear-gradient(135deg, #2E86AB 0%, #A23B72 100%)',
      features: [
        'Planification automatique',
        'Rapport détaillé',
        'Pièces incluses'
      ]
    },
    {
      icon: 'fas fa-tools',
      title: 'Réparation d\'Urgence',
      description: 'Intervention rapide 24h/7j pour résoudre tous types de pannes d\'imprimantes',
      color: 'linear-gradient(135deg, #F18701 0%, #F35B04 100%)',
      features: [
        'Intervention sous 24h',
        'Diagnostic gratuit',
        'Garantie 6 mois'
      ]
    },
    {
      icon: 'fas fa-file-contract',
      title: 'Contrat de Maintenance',
      description: 'Solutions sur-mesure avec contrats personnalisés selon vos besoins',
      color: 'linear-gradient(135deg, #6A994E 0%, #386641 100%)',
      features: [
        'Tarifs préférentiels',
        'Priorité d\'intervention',
        'Support dédié'
      ]
    },
    {
      icon: 'fas fa-headset',
      title: 'Support Technique',
      description: 'Assistance téléphonique et à distance pour résoudre rapidement vos problèmes',
      color: 'linear-gradient(135deg, #7209B7 0%, #560BAD 100%)',
      features: [
        'Hotline dédiée',
        'Assistance à distance',
        'Formation utilisateur'
      ]
    }
  ];

  processSteps = [
    {
      icon: 'fas fa-phone-alt',
      title: 'Prise de Contact',
      description: 'Nous analysons votre demande et planifions l\'intervention selon vos disponibilités'
    },
    {
      icon: 'fas fa-search',
      title: 'Diagnostic',
      description: 'Notre technicien effectue un diagnostic complet de votre équipement'
    },
    {
      icon: 'fas fa-wrench',
      title: 'Intervention',
      description: 'Réparation ou maintenance avec des pièces d\'origine et outils professionnels'
    },
    {
      icon: 'fas fa-clipboard-check',
      title: 'Validation',
      description: 'Tests de fonctionnement et remise d\'un rapport détaillé avec garantie'
    }
  ];

  stats = [
    { number: '500+', label: 'Entreprises Clientes', icon: 'fas fa-building' },
    { number: '2000+', label: 'Interventions Réalisées', icon: 'fas fa-tools' },
    { number: '98%', label: 'Taux de Satisfaction', icon: 'fas fa-heart' },
    { number: '24h', label: 'Délai d\'Intervention', icon: 'fas fa-clock' }
  ];

  testimonials = [
    {
      name: 'Marie Dubois',
      role: 'Directrice IT',
      company: 'TechCorp Solutions',
      message: 'Service exceptionnel ! Nos 50 imprimantes sont maintenues parfaitement. L\'équipe est professionnelle et réactive.',
      rating: 5,
      avatar: 'assets/img/messages-1.jpg'
    },
    {
      name: 'Pierre Martin',
      role: 'Responsable Technique',
      company: 'InnovateSA',
      message: 'Contrat de maintenance très avantageux. Intervention rapide et techniciens compétents. Je recommande !',
      rating: 5,
      avatar: 'assets/img/messages-2.jpg'
    },
    {
      name: 'Sophie Laurent',
      role: 'Office Manager',
      company: 'DigitalFlow',
      message: 'Maintenance préventive parfaite. Zéro panne depuis notre contrat. Excellent rapport qualité-prix.',
      rating: 5,
      avatar: 'assets/img/messages-3.jpg'
    }
  ];

  currentTestimonial = 0;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.startTestimonialCarousel();
  }

  ngAfterViewInit(): void {
    this.initScrollAnimations();
    this.init3DEffects();
  }

  startTestimonialCarousel(): void {
    setInterval(() => {
      this.currentTestimonial = (this.currentTestimonial + 1) % this.testimonials.length;
    }, 5000);
  }

  initScrollAnimations(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  }

  init3DEffects(): void {
    // Add mouse tracking for 3D tilt effect
    document.addEventListener('mousemove', (e) => {
      const cards = document.querySelectorAll('.service-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        (card as HTMLElement).style.transform = 
          `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
      });
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  createTicket(): void {
    this.router.navigate(['/login'], { queryParams: { redirect: '/tickets/create' } });
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
