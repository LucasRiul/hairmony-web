import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { AgendamentoService, Agendamento, AgendamentoRequest } from './agenda.service';
import { ClienteService } from '../clientes/clientes.service';
import { ServicoService } from '../servicos/servicos.service';
import { ColaboradoresService } from '../colaboradores/colaboradores.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

interface Cliente {
  id: string;
  nome: string;
  celular: string;
}

interface Servico {
  id: string;
  nome: string;
  duracao: number;
  preco: number;
}

interface Colaborador {
  id: string;
  nome: string;
  ativo: boolean;
}

interface HorarioAgenda {
  hora: string;
  minutos: string;
  display: string;
}

interface AgendamentoVisual extends Agendamento {
  top: string;
  height: string;
  left: string;
  width: string;
  backgroundColor: string;
  textColor: string;
}

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule, NgxMaskDirective],
  providers: [provideNgxMask()]
})
export class AgendaComponent implements OnInit {
  agendamentos: Agendamento[] = [];
  agendamentosVisuais: AgendamentoVisual[] = [];
  clientes: Cliente[] = [];
  servicos: Servico[] = [];
  colaboradores: Colaborador[] = [];
  horarios: HorarioAgenda[] = [];
  
  dataSelecionada: Date = new Date();
  agendamentoForm: FormGroup;
  isEditing = false;
  currentAgendamentoId: string | null = null;
  isLoading = false;
  
  // Cores para os agendamentos
  cores = [
    { bg: '#D4F9D4', text: '#1E5631' }, // Verde claro
    { bg: '#FFF2CC', text: '#7F6000' }, // Amarelo claro
    { bg: '#DAE8FC', text: '#0050A1' }, // Azul claro
    { bg: '#FFE6CC', text: '#803300' }, // Laranja claro
    { bg: '#F8CECC', text: '#990000' }, // Vermelho claro
    { bg: '#E1D5E7', text: '#4C0099' }  // Roxo claro
  ];
  
  constructor(
    private agendamentoService: AgendamentoService,
    private clienteService: ClienteService,
    private servicoService: ServicoService,
    private colaboradorService: ColaboradoresService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.agendamentoForm = this.fb.group({
      data_de: [new Date(), [Validators.required]],
      hora: ['08:00', [Validators.required]],
      clienteId: ['', [Validators.required]],
      servicoId: ['', [Validators.required]],
      colaboradorId: ['', [Validators.required]],
      repete: [false],
      dias: [{ value: 7, disabled: true }]
    });

    // Observador para habilitar/desabilitar o campo dias
    this.agendamentoForm.get('repete')?.valueChanges.subscribe(value => {
      if (value) {
        this.agendamentoForm.get('dias')?.enable();
      } else {
        this.agendamentoForm.get('dias')?.disable();
      }
    });
  }

  ngOnInit(): void {
    this.gerarHorarios();
    this.carregarDados();
  }

  gerarHorarios(): void {
    this.horarios = [];
    for (let hora = 8; hora <= 18; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horaStr = hora.toString().padStart(2, '0');
        const minutoStr = minuto.toString().padStart(2, '0');
        this.horarios.push({
          hora: horaStr,
          minutos: minutoStr,
          display: `${horaStr}:${minutoStr}`
        });
      }
    }
  }

  carregarDados(): void {
    this.isLoading = true;
    
    // Carregar clientes, serviços e colaboradores
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
      },
      error: (error) => console.error('Erro ao carregar clientes:', error)
    });
    
    this.servicoService.getServicos().subscribe({
      next: (data) => {
        this.servicos = data;
      },
      error: (error) => console.error('Erro ao carregar serviços:', error)
    });
    
    this.colaboradorService.getColaboradores().subscribe({
      next: (data) => {
        this.colaboradores = data.filter(c => c.ativo);
        this.carregarAgendamentos();
      },
      error: (error) => console.error('Erro ao carregar colaboradores:', error)
    });
  }

  carregarAgendamentos(): void {
    this.isLoading = true;
    this.agendamentoService.getAgendamentosComDetalhes(this.dataSelecionada).subscribe({
      next: (data) => {
        this.agendamentos = data;
        this.processarAgendamentosVisuais();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar agendamentos:', error);
        this.isLoading = false;
      }
    });
  }

  processarAgendamentosVisuais(): void {
    this.agendamentosVisuais = [];
    
    console.log('Todos agendamentos:', this.agendamentos);
    
    // Filtrar agendamentos apenas para a data selecionada
    const agendamentosDoDia = this.agendamentos.filter(agendamento => {
      // Converter para objetos Date
      const dataAgendamento = new Date(agendamento.data_de);
      const dataSelecionada = new Date(this.dataSelecionada);
      
      // Formatar para comparação apenas a data (sem hora)
      const dataAgendamentoStr = dataAgendamento.toISOString().split('T')[0];
      const dataSelecionadaStr = dataSelecionada.toISOString().split('T')[0];
      
      console.log('Comparando datas:', dataAgendamentoStr, dataSelecionadaStr);
      
      // Comparar as strings de data
      return dataAgendamentoStr === dataSelecionadaStr;
    });
    
    console.log('Agendamentos filtrados para o dia:', agendamentosDoDia);
    
    // Mapear colaboradores para colunas
    const colaboradoresMap = new Map<string, number>();
    this.colaboradores.forEach((colaborador, index) => {
      colaboradoresMap.set(colaborador.id, index);
    });
    
    // Calcular posição e tamanho de cada agendamento
    agendamentosDoDia.forEach((agendamento, index) => {
      // Garantir que as datas sejam objetos Date válidos
      const dataInicio = new Date(agendamento.data_de);
      const dataFim = new Date(agendamento.data_ate);
      
      // Verificar se as datas são válidas
      if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
        console.error('Data inválida para agendamento:', agendamento);
        return; // Pular este agendamento
      }
      
      // Calcular posição vertical (top) baseada na hora de início
      const horaInicio = dataInicio.getHours();
      const minutoInicio = dataInicio.getMinutes();
      const totalMinutosInicio = horaInicio * 60 + minutoInicio;
      
      // Calcular altura baseada na duração
      const horaFim = dataFim.getHours();
      const minutoFim = dataFim.getMinutes();
      const totalMinutosFim = horaFim * 60 + minutoFim;
      const duracaoMinutos = totalMinutosFim - totalMinutosInicio;
      
      // Calcular posição relativa ao início da agenda (8:00)
      const inicioAgenda = 8 * 60; // 8:00 em minutos
      const topPosicao = ((totalMinutosInicio - inicioAgenda) / 30) * 40; // 40px por slot de 30min
      const altura = (duracaoMinutos / 30) * 40; // 40px por slot de 30min
      
      // Calcular posição horizontal baseada no colaborador
      const colIndex = colaboradoresMap.get(agendamento.colaboradorId);
      
      // Se o colaborador não for encontrado, não mostrar o agendamento
      if (colIndex === undefined) {
        console.warn('Colaborador não encontrado para agendamento:', agendamento);
        return; // Pular este agendamento
      }
      
      // Calcular a posição left baseada no índice da coluna
      // Cada coluna tem 100% de largura em relação ao seu container
      const leftPosicao = `${colIndex * 100}%`;
      const largura = '100%'; // Cada agendamento ocupa 100% da largura da coluna
      
      // Selecionar cor baseada no serviço ou status
      const corIndex = index % this.cores.length;
      const cor = agendamento.concluido 
        ? { bg: '#E0E0E0', text: '#505050' } // Cinza para concluídos
        : this.cores[corIndex];
      
      this.agendamentosVisuais.push({
        ...agendamento,
        top: `${topPosicao}px`,
        height: `${altura}px`,
        left: leftPosicao,
        width: largura,
        backgroundColor: cor.bg,
        textColor: cor.text
      });
    });
  }

  mudarData(dias: number): void {
    const novaData = new Date(this.dataSelecionada);
    novaData.setDate(novaData.getDate() + dias);
    this.dataSelecionada = novaData;
    this.carregarAgendamentos();
  }

  formatarData(data: Date): string {
    return data.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  openModal(content: any, agendamento?: Agendamento): void {
    if (agendamento) {
      // Edição de agendamento existente
      this.isEditing = true;
      this.currentAgendamentoId = agendamento.id;
      
      const dataAgendamento = new Date(agendamento.data_de);
      const hora = dataAgendamento.getHours().toString().padStart(2, '0');
      const minutos = dataAgendamento.getMinutes().toString().padStart(2, '0');
      
      this.agendamentoForm.patchValue({
        data_de: dataAgendamento,
        hora: `${hora}:${minutos}`,
        clienteId: agendamento.clienteId,
        servicoId: agendamento.servicoId,
        colaboradorId: agendamento.colaboradorId,
        repete: false,
        dias: 7
      });
    } else {
      // Novo agendamento
      this.isEditing = false;
      this.currentAgendamentoId = null;
      
      this.agendamentoForm.patchValue({
        data_de: this.dataSelecionada,
        hora: '08:00',
        repete: false,
        dias: 7
      });
      
      this.agendamentoForm.get('clienteId')?.reset();
      this.agendamentoForm.get('servicoId')?.reset();
      this.agendamentoForm.get('colaboradorId')?.reset();
    }

    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  openDeleteConfirmation(content: any, agendamentoId: string): void {
    this.currentAgendamentoId = agendamentoId;
    this.modalService.open(content, { centered: true });
  }

  openConcluirConfirmation(content: any, agendamentoId: string): void {
    this.currentAgendamentoId = agendamentoId;
    this.modalService.open(content, { centered: true });
  }

  saveAgendamento(): void {
    if (this.agendamentoForm.invalid) {
      // Marcar todos os campos como touched para mostrar erros
      Object.keys(this.agendamentoForm.controls).forEach(key => {
        const control = this.agendamentoForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const formData = this.agendamentoForm.value;
    
    // Combinar data e hora
    // Combinar data e hora
    const dataSelecionada = new Date(formData.data_de);
    const [horas, minutos] = formData.hora.split(':').map(Number);

    // Ajustar para o fuso horário local
    dataSelecionada.setHours(horas, minutos, 0, 0);

    // Criar uma string ISO sem o ajuste de fuso horário
    // const dataISO = dataSelecionada.toISOString();

    const agendamentoRequest: AgendamentoRequest = {
      data_de: dataSelecionada, // Enviar como string ISO
      clienteId: formData.clienteId,
      servicoId: formData.servicoId,
      colaboradorId: formData.colaboradorId,
      repete: formData.repete,
      dias: formData.repete ? formData.dias : undefined
    };
    
    if (this.isEditing && this.currentAgendamentoId) {
      // Buscar o agendamento atual primeiro
      this.agendamentoService.getAgendamento(this.currentAgendamentoId).subscribe({
        next: (agendamentoAtual) => {
          // Criar objeto completo com todos os campos originais + atualizações
          const agendamentoCompleto = {
            ...agendamentoAtual,
            data_de: dataSelecionada,
            clienteId: formData.clienteId,
            servicoId: formData.servicoId,
            colaboradorId: formData.colaboradorId
          };
          
          // Calcular data_ate baseado na duração do serviço
          const servico = this.servicos.find(s => s.id === formData.servicoId);
          if (servico) {
            const dataAte = new Date(dataSelecionada);
            dataAte.setMinutes(dataAte.getMinutes() + servico.duracao);
            agendamentoCompleto.data_ate = dataAte;
          }
          
          // Enviar o objeto completo para a API
          this.http.put(`${this.agendamentoService.apiUrl}/${this.currentAgendamentoId}`, agendamentoCompleto).subscribe({
            next: () => {
              this.modalService.dismissAll();
              this.carregarAgendamentos();
            },
            error: (error) => {
              console.error('Erro ao atualizar agendamento:', error);
              console.log('Payload enviado:', agendamentoCompleto);
            }
          });
        },
        error: (error) => console.error('Erro ao buscar agendamento atual:', error)
      });
    } else {
      // Criar novo agendamento
      this.agendamentoService.createAgendamento(agendamentoRequest).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.carregarAgendamentos();
        },
        error: (error) => console.error('Erro ao criar agendamento:', error)
      });
    }
  }

  deleteAgendamento(): void {
    if (this.currentAgendamentoId) {
      this.agendamentoService.deleteAgendamento(this.currentAgendamentoId).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.carregarAgendamentos();
        },
        error: (error) => console.error('Erro ao excluir agendamento:', error)
      });
    }
  }

  concluirAgendamento(): void {
    if (this.currentAgendamentoId) {
      this.agendamentoService.concluirAgendamento(this.currentAgendamentoId).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.carregarAgendamentos();
        },
        error: (error) => console.error('Erro ao concluir agendamento:', error)
      });
    }
  }

  getDuracaoServico(servicoId: string): number {
    const servico = this.servicos.find(s => s.id === servicoId);
    return servico ? servico.duracao : 30;
  }

  getNomeCliente(clienteId: string): string {
    const cliente = this.clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nome : 'Cliente não encontrado';
  }

  getNomeServico(servicoId: string): string {
    const servico = this.servicos.find(s => s.id === servicoId);
    return servico ? servico.nome : 'Serviço não encontrado';
  }

  getPrecoServico(servicoId: string): string {
    const servico = this.servicos.find(s => s.id === servicoId);
    return servico ? servico.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
  }

  formatHorario(data: Date | string): string {
    // Garantir que data seja um objeto Date
    const dataObj = data instanceof Date ? data : new Date(data);
    
    // Verificar se é uma data válida
    if (isNaN(dataObj.getTime())) {
      return '--:--'; // Retornar um valor padrão para datas inválidas
    }
    
    const hora = dataObj.getHours().toString().padStart(2, '0');
    const minutos = dataObj.getMinutes().toString().padStart(2, '0');
    return `${hora}:${minutos}`;
  }
}
