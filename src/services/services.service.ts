import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from './interfaces/service.interface';

@Injectable()
export class ServicesService {
  // TODO Read from database
  private readonly services: Service[] = [
    {
      id: 1,
      name: '_bukkit_',
      owner: { name: 'Admin' },
      software: { id: 1 },
      isGlobal: true,
    },
    {
      id: 4,
      name: 'SafeTrade',
      owner: { name: 'BtoBastian' },
      software: { id: 1 },
      isGlobal: false,
    },
  ];

  findAll(): Service[] {
    return this.services;
  }

  findOne(id: number): Service {
    const service = this.services.find((service) => service.id === id);
    if (service == null) {
      throw new NotFoundException();
    }
    return service;
  }
}
