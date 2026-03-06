import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const TutorialContext = createContext(null);

export const TUTORIAL_STEPS = [
  // LobbyPage
  {
    target: null,
    title: '👋 Bem-vindo ao VCM!',
    description: 'O Valorant Custom Manager ajuda você a organizar partidas personalizadas com até 10 jogadores. Este tutorial rápido vai te mostrar como tudo funciona.',
    position: 'center',
  },
  {
    target: 'tutorial-lobby-list',
    title: '📋 Lista de Salas',
    description: 'Aqui aparecem todas as salas criadas. Cada card mostra o mapa, data, horário, status da partida e quantas vagas restam.',
    position: 'bottom',
  },
  {
    target: 'tutorial-new-lobby-btn',
    title: '➕ Criar uma Sala',
    description: 'Clique em "Nova Sala" para criar uma nova partida. Vamos criar uma agora — clique em Próximo e o formulário vai abrir automaticamente!',
    position: 'bottom',
    openModal: true,
  },
  // CreateLobbyModal
  {
    target: 'tutorial-modal-mapa',
    title: '🗺️ Escolha o Mapa',
    description: 'Selecione o mapa onde a partida vai acontecer. Você pode trocar o mapa depois, mesmo com jogadores na sala.',
    position: 'bottom',
  },
  {
    target: 'tutorial-modal-datahora',
    title: '📅 Data e Horário',
    description: 'Defina quando a partida vai acontecer. Isso ajuda os jogadores a se organizarem com antecedência.',
    position: 'bottom',
  },
  {
    target: 'tutorial-modal-maxplayers',
    title: '👥 Vagas de Titulares',
    description: 'Quantos jogadores podem participar como titulares (máximo 10). Quem entrar depois da lotação vai para a lista de espera.',
    position: 'bottom',
  },
  {
    target: 'tutorial-modal-waitlist',
    title: '⏳ Lista de Espera',
    description: 'Jogadores que chegarem depois das vagas preenchidas ficam aqui. Se alguém sair, o primeiro da fila assume automaticamente.',
    position: 'bottom',
  },
  {
    target: 'tutorial-modal-admplayer',
    title: '🎮 Você vai jogar?',
    description: 'Marque esta opção se quiser ser um dos 10 titulares além de administrar a sala. Desmarcando, você só gerencia sem ocupar vaga.',
    position: 'top',
  },
  {
    target: 'tutorial-modal-submit',
    title: '✅ Criar a Sala',
    description: 'Pronto! Clique em "Criar Sala" para continuar o tutorial — vamos ver como é a tela da sala.',
    position: 'top',
    submitModal: true,
  },
  // MatchPage
  {
    target: 'tutorial-match-banner',
    title: '🏟️ Tela da Sala',
    description: 'Esta é a sala criada. O banner mostra o mapa, status da partida (Aguardando, Em Jogo, Encerrada) e quando foi iniciada.',
    position: 'bottom',
  },
  {
    target: 'tutorial-match-players',
    title: '👤 Grade de Jogadores',
    description: 'Aqui ficam os titulares. Como ADM, você pode confirmar a presença de cada jogador (✓) ou removê-los (✕). Vagas vazias permitem que novos jogadores entrem.',
    position: 'top',
  },
  {
    target: 'tutorial-match-adm-controls',
    title: '⚙️ Controles do ADM',
    description: '"Iniciar Partida" começa o jogo. "Próxima Partida" avança para a rodada seguinte (mantendo os jogadores). "Cancelar" encerra a sala.',
    position: 'bottom',
  },
  {
    target: 'tutorial-match-custom-code',
    title: '🔑 Código Personalizado',
    description: 'Ao iniciar a partida, insira o código do jogo personalizado do Valorant aqui. Apenas os 10 titulares verão o código — lista de espera e visitantes não.',
    position: 'top',
  },
  {
    target: 'tutorial-match-chat',
    title: '💬 Chat da Sala',
    description: 'Todos os participantes podem se comunicar em tempo real pelo chat. As mensagens ficam disponíveis para quem entrar depois também.',
    position: 'top',
  },
  {
    target: 'tutorial-match-share',
    title: '🔗 Compartilhar',
    description: 'Copie o link da sala e envie para os jogadores. Qualquer pessoa com o link pode ver a sala e entrar, se houver vaga.',
    position: 'bottom',
  },
  {
    target: null,
    title: '🎉 Tutorial Concluído!',
    description: 'Agora você sabe tudo que precisa para organizar suas partidas no VCM. Boa sorte nas suas customs!',
    position: 'center',
  },
];

function buildMockLobby(nick) {
  const now = new Date();
  now.setHours(now.getHours() + 2, 0, 0, 0);
  return {
    lobby_id: '__tutorial__',
    adm_user_id: '__tutorial_adm__',
    status: 'WAITING',
    match_count: 0,
    started_at: null,
    config: {
      mapa: 'Haven',
      data_hora: now.toISOString(),
      max_players: 10,
      waitlist_limit: 20,
      adm_nick: nick,
      adm_is_player: true,
    },
    players: [
      { nick, is_present: true, is_adm: true },
      { nick: 'Jett#BR1', is_present: false, is_adm: false },
      { nick: 'Sage#BR2', is_present: true, is_adm: false },
    ],
    waitlist: [
      { nick: 'Phoenix#BR3', joined_at: new Date().toISOString() },
    ],
    custom_code: null,
  };
}

export function TutorialProvider({ children }) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [mockLobby, setMockLobby] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const startTutorial = useCallback((nick) => {
    setMockLobby(buildMockLobby(nick));
    setStep(0);
    setActive(true);
    setModalOpen(false);
  }, []);

  const endTutorial = useCallback(() => {
    localStorage.setItem('vcm_tutorial_done', '1');
    setActive(false);
    setStep(0);
    setModalOpen(false);
    navigate('/');
  }, [navigate]);

  const nextStep = useCallback(() => {
    setStep(prev => {
      const next = prev + 1;
      const nextStepDef = TUTORIAL_STEPS[next];

      if (nextStepDef?.openModal) {
        setModalOpen(true);
      }
      if (nextStepDef?.submitModal) {
        // will be handled by LobbyPage
      }

      if (next >= TUTORIAL_STEPS.length) {
        localStorage.setItem('vcm_tutorial_done', '1');
        setActive(false);
        navigate('/');
        return 0;
      }

      // Navigate to match page when entering MatchPage steps
      if (next === 9) {
        setModalOpen(false);
        navigate('/match/__tutorial__');
      }

      return next;
    });
  }, [navigate]);

  const prevStep = useCallback(() => {
    setStep(prev => {
      const prevIdx = Math.max(0, prev - 1);
      const prevStepDef = TUTORIAL_STEPS[prevIdx];

      // Going back from MatchPage to LobbyPage
      if (prev === 9) {
        setModalOpen(true);
        navigate('/');
      }
      // Going back into modal steps
      if (prevStepDef?.openModal || (prevIdx >= 3 && prevIdx <= 8)) {
        setModalOpen(true);
      }

      return prevIdx;
    });
  }, [navigate]);

  const skipTutorial = useCallback(() => {
    localStorage.setItem('vcm_tutorial_done', '1');
    setActive(false);
    setStep(0);
    setModalOpen(false);
  }, []);

  return (
    <TutorialContext.Provider value={{
      active, step, mockLobby, modalOpen,
      setModalOpen,
      startTutorial, nextStep, prevStep, endTutorial, skipTutorial,
      currentStepDef: TUTORIAL_STEPS[step] ?? null,
      isLastStep: step === TUTORIAL_STEPS.length - 1,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
}
