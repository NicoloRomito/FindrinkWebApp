import { Component } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule} from '@angular/common';
import { MessageService, PrimeTemplate } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { Panel } from 'primeng/panel';
import { Avatar } from 'primeng/avatar';
import { ButtonDirective } from 'primeng/button';
import { ProfileButtonComponent, LeftButtonsComponent } from 'shared';

interface TeamMember {
  fullName: string;
  initials: string;
  tagline: string;
  bio: string;
  linkedin?: string;
  github?: string;
  email?: string;
}

@Component({
  selector: 'app-about-page',
  standalone: true,
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  providers: [MessageService],
  imports: [
    Panel, Toast, Card, Avatar, Divider,
    CommonModule, PrimeTemplate, ButtonDirective,
    ProfileButtonComponent, LeftButtonsComponent,
  ]
})
export class AboutComponent {
  constructor(private clip: Clipboard, private toast: MessageService) {}

  team: TeamMember[] = [
    {
      fullName: 'Nicolò Romito',
      initials: 'NR',
      tagline : 'Frontend Developer',
      bio     : 'Frontend student, Cybersecurity, Blockchain and coffee lover.',
      linkedin: 'https://www.linkedin.com/in/nicolo-romito/',
      github  : 'https://github.com/NicoloRomito',
      email   : 'nromito@student.42firenze.it',
    },
    {
      fullName: 'Stefano Montuori',
      initials: 'SM',
      tagline : 'Backend & Data Engineer',
      bio     : 'Passionate about microservices, data pipelines and DevOps.',
      linkedin: 'linkedin www.linkedin.com/in/42-smontuor',
      github  : 'https://github.com/CapSte42',
      email   : 'smontuor@student.42firenze.it',
    },
  ];

  copyEmail(address: string): void {
    this.clip.copy(address);
    this.toast.add({
      severity : 'info',
      summary  : 'E-mail copied',
      detail   : address,
      life     : 2000,
    });
  }
}
