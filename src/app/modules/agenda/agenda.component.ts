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
import { Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

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
      clienteid: ['', [Validators.required]],
      servicoid: ['', [Validators.required]],
      colaboradorid: ['', [Validators.required]],
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
    for (let hora = 6; hora <= 23; hora++) {
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

  // Função auxiliar para comparar apenas as datas (sem horas)
  private saoMesmaData(data1: Date, data2: Date): boolean {
    return (
      data1.getFullYear() === data2.getFullYear() &&
      data1.getMonth() === data2.getMonth() &&
      data1.getDate() === data2.getDate()
    );
  }

  processarAgendamentosVisuais(): void {
    this.agendamentosVisuais = [];
    
    console.log('Todos agendamentos:', this.agendamentos);
    
    // Criar uma cópia da data selecionada para comparação
    const dataSelecionadaObj = new Date(this.dataSelecionada);
    
    // Filtrar agendamentos apenas para a data selecionada
    const agendamentosDoDia = this.agendamentos.filter(agendamento => {
      // Converter para objetos Date
      const dataAgendamento = new Date(agendamento.data_de);
      dataAgendamento.setHours(dataAgendamento.getHours() + 3);
      
      // Comparar apenas as datas (sem horas)
      return this.saoMesmaData(dataAgendamento, dataSelecionadaObj);
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
      dataInicio.setHours(dataInicio.getHours() + 3);
      dataFim.setHours(dataFim.getHours() + 3);

      
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
      const inicioAgenda = 6 * 60; // 6:00 em minutos
      const topPosicao = ((totalMinutosInicio - inicioAgenda) / 30) * 65; // 65px por slot de 30min
      const altura = (duracaoMinutos / 30) * 65; // 65px por slot de 30min
      
      // Obter o índice da coluna para o colaborador deste agendamento
      const colIndex = colaboradoresMap.get(agendamento.colaboradorid);
      
      // Se o colaborador não for encontrado, não mostrar o agendamento
      if (colIndex === undefined) {
        console.warn('Colaborador não encontrado para agendamento:', agendamento);
        return; // Pular este agendamento
      }
      
      // Calcular a posição left baseada no índice da coluna
      const leftPosicao = `${colIndex * (100 / colaboradoresMap.size)}%`;
      
      // Selecionar cor baseada no serviço ou status
      const corIndex = index % this.cores.length;
      const cor = agendamento.concluido 
        ? { bg: '#E0E0E0', text: '#505050' } // Cinza para concluídos
        : this.cores[corIndex];
      var widthC = 100 / colaboradoresMap.size;
      this.agendamentosVisuais.push({
        ...agendamento,
        top: `${topPosicao}px`,
        height: `${altura}px`,
        left: leftPosicao,
        width: `${widthC}%`,
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
      const dataFormatada = dataAgendamento.toISOString().substring(0, 10);
      const hora = dataAgendamento.getHours().toString().padStart(2, '0');
      const minutos = dataAgendamento.getMinutes().toString().padStart(2, '0');
      
      this.agendamentoForm.patchValue({
        // data_de: dataAgendamento,
        data_de: `${dataFormatada}`,
        hora: `${hora}:${minutos}`,
        clienteid: agendamento.clienteid,
        servicoid: agendamento.servicoid,
        colaboradorid: agendamento.colaboradorid,
        repete: false,
        dias: 7
      });
    } else {
      // Novo agendamento
      this.isEditing = false;
      this.currentAgendamentoId = null;
      var dt  = this.dataSelecionada.toISOString().substring(0, 10);
      
      this.agendamentoForm.patchValue({
        data_de: dt,
        hora: '08:00',
        repete: false,
        dias: 7
      });
      
      this.agendamentoForm.get('clienteid')?.reset();
      this.agendamentoForm.get('servicoid')?.reset();
      this.agendamentoForm.get('colaboradorid')?.reset();
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

  // Função auxiliar para criar uma data UTC a partir de uma data local e hora
  private criarDataUTC(dataLocal: Date, horaStr: string): Date {
    const [horas, minutos] = horaStr.split(':').map(Number);
    
    // Criar uma nova data para não modificar a original
    const data = new Date(dataLocal);
    
    // Definir horas e minutos
    data.setHours(horas, minutos, 0, 0);
    
    return data;
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
    
    // Obter a data do formulário
    const dataForm = new Date(formData.data_de + 'T' + formData.hora + ':00');
    
    // Criar uma data com a hora selecionada
    
    // Calcular data_ate baseado na duração do serviço
    const servico = this.servicos.find(s => s.id === formData.servicoId);
    
    if (this.isEditing && this.currentAgendamentoId) {
      // Buscar o agendamento atual primeiro
      this.agendamentoService.getAgendamento(this.currentAgendamentoId).subscribe({
        next: (agendamentoAtual) => {
          // Criar objeto completo com todos os campos originais + atualizações
          const agendamentoCompleto = {
            ...agendamentoAtual,
            data_de: dataForm,
            data_ate: dataForm,
            clienteid: formData.clienteid,
            servicoid: formData.servicoid,
            colaboradorid: formData.colaboradorid
          };
          
          console.log('Atualizando agendamento:', agendamentoCompleto);
          
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
      const agendamentoRequest: AgendamentoRequest = {
        data_de: dataForm,
        clienteid: formData.clienteid,
        servicoid: formData.servicoid,
        colaboradorid: formData.colaboradorid,
        repete: formData.repete,
        dias: formData.repete ? formData.dias : undefined
      };
      
      console.log('Criando novo agendamento:', agendamentoRequest);
      
      this.agendamentoService.createAgendamento(agendamentoRequest).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.carregarAgendamentos();
        },
        error: (error) => {
          console.error('Erro ao criar agendamento:', error);
          console.log('Payload enviado:', agendamentoRequest);
        }
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

  getDuracaoServico(servicoid: string): number {
    const servico = this.servicos.find(s => s.id === servicoid);
    return servico ? servico.duracao : 30;
  }

  getNomeCliente(clienteid: string): string {
    const cliente = this.clientes.find(c => c.id === clienteid);
    return cliente ? cliente.nome : 'Cliente não encontrado';
  }

  getNomeServico(servicoid: string): string {
    const servico = this.servicos.find(s => s.id === servicoid);
    return servico ? servico.nome : 'Serviço não encontrado';
  }

  getPrecoServico(servicoid: string): string {
    const servico = this.servicos.find(s => s.id === servicoid);
    return servico ? servico.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
  }

  formatHorario(data: Date | string): string {
    // Garantir que data seja um objeto Date
    const dataObj = data instanceof Date ? data : new Date(data);
    dataObj.setHours(dataObj.getHours() + 3);

    
    // Verificar se é uma data válida
    if (isNaN(dataObj.getTime())) {
      return '--:--'; // Retornar um valor padrão para datas inválidas
    }
    
    const hora = dataObj.getHours().toString().padStart(2, '0');
    const minutos = dataObj.getMinutes().toString().padStart(2, '0');
    return `${hora}:${minutos}`;
  }

  baixarRelatorio() {
    this.agendamentoService.relatorioSemanal().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'AgendamentosSemana.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erro ao baixar o relatório:', err);
        alert('Erro ao baixar o relatório. Verifique se a API está rodando.');
      }
    });
  }

  private formatarDataSemTimezone(data: Date): string {
    // Formato ISO sem o 'Z' no final (que indica UTC)
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}T${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}:${String(data.getSeconds()).padStart(2, '0')}`;
  }
}
