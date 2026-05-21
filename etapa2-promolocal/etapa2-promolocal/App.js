import React, { useMemo, useState } from 'react';
import {  ActivityIndicator,  Alert,  Image,  KeyboardAvoidingView,  Modal,  Platform,  Pressable,  SafeAreaView,  ScrollView,  StatusBar,
  StyleSheet,  Text,  TextInput,  View,} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {  PromoLocalProvider,  usePromoLocal,} from './src/context/PromoLocalContext';
import { buscarCepCorreios,  buscarEstadosIbge,  validarCidadeNoIbge, } from './src/services/locationApi';

const categorias = [
  'Todas',
  'Frutas',
  'Legumes',
  'Bebidas',
  'Carnes',
  'Padaria',
  'Limpeza',
];
const imagemPadrao =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=900&auto=format&fit=crop';

export default function App() {
  // Esse componente principal coloca o contexto em volta do app inteiro.
  return (
    <PromoLocalProvider>
      <PromoLocalApp />
    </PromoLocalProvider>
  );
}

function PromoLocalApp() {
  // Aqui eu decido se mostro login ou a home, dependendo se o usuario entrou.
  const { usuario, carregando } = usePromoLocal();

  if (carregando) {
    return (
       <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#197278" />
        <Text style={styles.loadingText}>Carregando o PromoLocal...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="dark-content" />
      {usuario ? <HomeScreen /> : <AuthScreen />}
    </SafeAreaView>
  );
}

function AuthScreen() {
  // Tela de login e cadastro, do jeito pedido no fluxo de autenticacao.
  const { entrar } = usePromoLocal();
  const [modoCadastro, setModoCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('aluno@unibr.com');
  const [senha, setSenha] = useState('123456');

  function autenticar() {
    // Valido o basico para nao deixar a pessoa entrar com campo vazio.
    if (!email || !senha || (modoCadastro && !nome)) {
      Alert.alert('Atenção', 'Preencha os campos obrigatorios.');
      return;
    }

    entrar(email);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.authContainer}>
      <View style={styles.logoCircle}>
        <Ionicons name="pricetag" size={34} color="#ffffff" />
      </View>
      <Text style={styles.authTitle}>PromoLocal</Text>
      <Text style={styles.authSubtitle}>
        Ofertas perto de você e mais visibilidade para o comércio local.
      </Text>

      {modoCadastro && (
        <Input
          label="Nome"
          value={nome}
          onChangeText={setNome}
          placeholder="Seu nome"
        />
      )}
      <Input
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="email@exemplo.com"
        keyboardType="email-address"
      />
      <Input
        label="Senha"
        value={senha}
        onChangeText={setSenha}
        placeholder="Senha"
        secureTextEntry
      />

      <PrimaryButton
        label={modoCadastro ? 'Criar conta' : 'Entrar'}
        icon="log-in-outline"
        onPress={autenticar}
      />
      <GhostButton
        label={modoCadastro ? 'Já tenho cadastro' : 'Criar cadastro'}
        icon={modoCadastro ? 'person-outline' : 'person-add-outline'}
        onPress={() => setModoCadastro(!modoCadastro)}
      />
      <GhostButton
        label="Entrar com Google"
        icon="logo-google"
        onPress={() => entrar('google@promolocal.com')}
      />
    </KeyboardAvoidingView>
  );
}

function HomeScreen() {
  // Tela inicial do cliente, com busca, categorias e listagem das promocoes.
  const { promocoes, sair } = usePromoLocal();
  const [categoria, setCategoria] = useState('Todas');
  const [busca, setBusca] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  const [tela, setTela] = useState('home');

  const promocoesFiltradas = useMemo(() => {
    // Filtro por categoria e tambem pelo texto digitado na busca.
    return promocoes.filter((promocao) => {
      const texto =
        `${promocao.produto} ${promocao.lojaNome} ${promocao.categoria}`.toLowerCase();
      const combinaBusca = texto.includes(busca.toLowerCase());
      const combinaCategoria =
        categoria === 'Todas' || promocao.categoria === categoria;
      return combinaBusca && combinaCategoria;
    });
  }, [promocoes, busca, categoria]);

  if (tela === 'loja') {
    return <LojaScreen voltar={() => setTela('home')} />;
  }

  return (
    <View style={styles.flex}>
      <Header
        title="PromoLocal"
        subtitle="Promoções próximas"
        leftIcon="menu"
        onLeftPress={() => setMenuAberto(true)}
        rightIcon="exit-outline"
        onRightPress={sair}
      />

      <ScrollView contentContainerStyle={styles.screen}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar produto ou loja"
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRow}>
          {categorias.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategoria(item)}
              style={[
                styles.categoryButton,
                categoria === item && styles.categoryButtonActive,
              ]}>
              <Text
                style={[
                  styles.categoryText,
                  categoria === item && styles.categoryTextActive,
                ]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ofertas encontradas</Text>
          <Text style={styles.resultCount}>
            {promocoesFiltradas.length} itens
          </Text>
        </View>

        {promocoesFiltradas.map((promocao) => (
          <PromocaoCard key={promocao.id} promocao={promocao} />
        ))}
      </ScrollView>

      <Sidebar
        aberto={menuAberto}
        fechar={() => setMenuAberto(false)}
        categoria={categoria}
        selecionarCategoria={(item) => {
          setCategoria(item);
          setMenuAberto(false);
        }}
        abrirLoja={() => {
          setMenuAberto(false);
          setTela('loja');
        }}
      />
    </View>
  );
}

function Sidebar({
  aberto,
  fechar,
  categoria,
  selecionarCategoria,
  abrirLoja,
}) {
  // Menu lateral para navegar pelas categorias e acessar a area do lojista.
  return (
    <Modal
      visible={aberto}
      transparent
      animationType="fade"
      onRequestClose={fechar}>
      <Pressable style={styles.overlay} onPress={fechar}>
        <Pressable style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Menu</Text>
          {categorias.map((item) => (
            <Pressable
              key={item}
              onPress={() => selecionarCategoria(item)}
              style={styles.sidebarItem}>
              <Ionicons
                name={
                  categoria === item ? 'radio-button-on' : 'radio-button-off'
                }
                size={18}
                color="#197278"
              />
              <Text style={styles.sidebarText}>{item}</Text>
            </Pressable>
          ))}
          <View style={styles.sidebarDivider} />
          <Pressable onPress={abrirLoja} style={styles.sidebarItem}>
            <Ionicons name="storefront-outline" size={18} color="#197278" />
            <Text style={styles.sidebarText}>Minha Loja</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function LojaScreen({ voltar }) {
  // Area do lojista separada em abas para ficar mais facil de usar.
  const [aba, setAba] = useState('editar');

  return (
    <View style={styles.flex}>
      <Header
        title="Minha Loja"
        subtitle="Área do lojista"
        leftIcon="arrow-back"
        onLeftPress={voltar}
      />
      <View style={styles.tabs}>
        <TabButton
          label="Editar Loja"
          active={aba === 'editar'}
          onPress={() => setAba('editar')}
        />
        <TabButton
          label="Promoções"
          active={aba === 'promocoes'}
          onPress={() => setAba('promocoes')}
        />
        <TabButton
          label="Nova"
          active={aba === 'nova'}
          onPress={() => setAba('nova')}
        />
      </View>
      {aba === 'editar' && <EditarLoja />}
      {aba === 'promocoes' && <GerenciarPromocoes />}
      {aba === 'nova' && (
        <NovaPromocao irParaLista={() => setAba('promocoes')} />
      )}
    </View>
  );
}

function EditarLoja() {
  // Formulario onde o lojista altera os dados principais da loja.
  const { loja, atualizarLoja } = usePromoLocal();
  const [form, setForm] = useState(loja);
  const [validando, setValidando] = useState(false);

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function preencherEnderecoPorCep() {
    try {
      setValidando(true);
      const endereco = await buscarCepCorreios(form.cep);
      const cidadeExiste = await validarCidadeNoIbge(
        endereco.cidade,
        endereco.uf
      );

      // Depois de buscar o CEP eu valido a cidade na API do IBGE.
      setForm((atual) => ({
        ...atual,
        cep: endereco.cep,
        rua: endereco.rua,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        uf: endereco.uf,
      }));

      Alert.alert(
        'Endereço validado',
        cidadeExiste
          ? 'CEP e cidade confirmados nas APIs.'
          : 'CEP encontrado, mas a cidade nao foi confirmada no IBGE.'
      );
    } catch (error) {
      Alert.alert('Erro na validação', error.message);
    } finally {
      setValidando(false);
    }
  }

  async function salvar() {
    if (!form.nome || !form.documento || !form.telefone) {
      Alert.alert('Atenção', 'Nome, CNPJ/MEI e telefone sao obrigatorios.');
      return;
    }

    await atualizarLoja(form);
    Alert.alert('Salvo', 'Dados da loja atualizados.');
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Input
        label="Nome da loja"
        value={form.nome}
        onChangeText={(v) => atualizarCampo('nome', v)}
      />
      <Input
        label="CNPJ/MEI"
        value={form.documento}
        onChangeText={(v) => atualizarCampo('documento', v)}
      />
      <Input
        label="Tipo de comércio"
        value={form.tipo}
        onChangeText={(v) => atualizarCampo('tipo', v)}
      />
      <Input
        label="CEP"
        value={form.cep}
        onChangeText={(v) => atualizarCampo('cep', v)}
        keyboardType="numeric"
      />
      <GhostButton
        label={validando ? 'Validando...' : 'Buscar CEP e validar cidade'}
        icon="location-outline"
        onPress={preencherEnderecoPorCep}
      />
      <Input
        label="Endereço"
        value={form.rua}
        onChangeText={(v) => atualizarCampo('rua', v)}
      />
      <Input
        label="Bairro"
        value={form.bairro}
        onChangeText={(v) => atualizarCampo('bairro', v)}
      />
      <View style={styles.row}>
        <View style={styles.rowLarge}>
          <Input
            label="Cidade"
            value={form.cidade}
            onChangeText={(v) => atualizarCampo('cidade', v)}
          />
        </View>
        <View style={styles.rowSmall}>
          <Input
            label="UF"
            value={form.uf}
            onChangeText={(v) => atualizarCampo('uf', v.toUpperCase())}
            maxLength={2}
          />
        </View>
      </View>
      <Input
        label="Telefone"
        value={form.telefone}
        onChangeText={(v) => atualizarCampo('telefone', v)}
        keyboardType="phone-pad"
      />
      <Input
        label="Descrição"
        value={form.descricao}
        onChangeText={(v) => atualizarCampo('descricao', v)}
        multiline
      />
      <PrimaryButton label="Salvar loja" icon="save-outline" onPress={salvar} />
    </ScrollView>
  );
}

function GerenciarPromocoes() {
  // Lista de promocoes do lojista, com botoes para ativar, pausar e excluir.
  const { promocoes, mudarStatusPromocao, removerPromocao } = usePromoLocal();

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {promocoes.map((promocao) => (
        <View key={promocao.id} style={styles.manageItem}>
          <View style={styles.flex}>
            <Text style={styles.manageTitle}>{promocao.produto}</Text>
            <Text style={styles.manageInfo}>
              R$ {Number(promocao.precoPromocional).toFixed(2)} • validade{' '}
              {promocao.validade}
            </Text>
            <Text
              style={[
                styles.statusText,
                promocao.ativa ? styles.activeText : styles.inactiveText,
              ]}>
              {promocao.ativa ? 'Ativa' : 'Desativada'}
            </Text>
          </View>
          <Pressable
            style={styles.iconButton}
            onPress={() => mudarStatusPromocao(promocao)}>
            <Ionicons
              name={promocao.ativa ? 'pause-outline' : 'play-outline'}
              size={20}
              color="#197278"
            />
          </Pressable>
          <Pressable
            style={styles.iconButtonDanger}
            onPress={() => removerPromocao(promocao.id)}>
            <Ionicons name="trash-outline" size={20} color="#b42318" />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function NovaPromocao({ irParaLista }) {
  // Formulario usado para cadastrar uma nova promocao no banco SQLite.
  const { adicionarPromocao } = usePromoLocal();
  const [form, setForm] = useState({
    produto: '',
    categoria: 'Frutas',
    precoOriginal: '',
    precoPromocional: '',
    unidade: 'kg',
    validade: '',
    descricao: '',
    imagem: '',
  });

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function escolherImagem() {
    // Aqui o lojista escolhe a imagem que vai aparecer no card da promocao.
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        'Permissão necessária',
        'Permita acessar a galeria para escolher a imagem.'
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!resultado.canceled) {
      atualizarCampo('imagem', resultado.assets[0].uri);
    }
  }

  async function publicar() {
    const obrigatorios = [
      'produto',
      'categoria',
      'precoOriginal',
      'precoPromocional',
      'unidade',
      'validade',
      'descricao',
    ];
    const faltando = obrigatorios.some((campo) => !form[campo]);

    if (faltando) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatorios.');
      return;
    }

    await adicionarPromocao(form);
    Alert.alert('Publicado', 'Promoção cadastrada com sucesso.');
    irParaLista();
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Input
        label="Produto"
        value={form.produto}
        onChangeText={(v) => atualizarCampo('produto', v)}
      />
      <Text style={styles.inputLabel}>Categoria</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}>
        {categorias
          .filter((item) => item !== 'Todas')
          .map((item) => (
            <Pressable
              key={item}
              onPress={() => atualizarCampo('categoria', item)}
              style={[
                styles.categoryButton,
                form.categoria === item && styles.categoryButtonActive,
              ]}>
              <Text
                style={[
                  styles.categoryText,
                  form.categoria === item && styles.categoryTextActive,
                ]}>
                {item}
              </Text>
            </Pressable>
          ))}
      </ScrollView>
      <View style={styles.row}>
        <View style={styles.rowLarge}>
          <Input
            label="Preço original"
            value={form.precoOriginal}
            onChangeText={(v) => atualizarCampo('precoOriginal', v)}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.rowLarge}>
          <Input
            label="Preço promocional"
            value={form.precoPromocional}
            onChangeText={(v) => atualizarCampo('precoPromocional', v)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      <Input
        label="Unidade (kg, un, L)"
        value={form.unidade}
        onChangeText={(v) => atualizarCampo('unidade', v)}
      />
      <Input
        label="Data de validade"
        value={form.validade}
        onChangeText={(v) => atualizarCampo('validade', v)}
        placeholder="2026-06-30"
      />
      <Input
        label="Descrição"
        value={form.descricao}
        onChangeText={(v) => atualizarCampo('descricao', v)}
        multiline
      />
      {form.imagem ? (
        <Image source={{ uri: form.imagem }} style={styles.previewImage} />
      ) : null}
      <GhostButton
        label="Escolher imagem"
        icon="image-outline"
        onPress={escolherImagem}
      />
      <PrimaryButton
        label="Publicar promoção"
        icon="cloud-upload-outline"
        onPress={publicar}
      />
    </ScrollView>
  );
}

function PromocaoCard({ promocao }) {
  // Card visual que mostra os dados principais de cada promocao para o cliente.
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: promocao.imagem || imagemPadrao }}
        style={styles.cardImage}
      />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.badge}>{promocao.categoria}</Text>
          <Text
            style={[
              styles.badge,
              promocao.ativa ? styles.badgeActive : styles.badgeInactive,
            ]}>
            {promocao.ativa ? 'Ativa' : 'Inativa'}
          </Text>
        </View>
        <Text style={styles.cardTitle}>{promocao.produto}</Text>
        <Text style={styles.storeName}>{promocao.lojaNome}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.oldPrice}>
            R$ {Number(promocao.precoOriginal).toFixed(2)}
          </Text>
          <Text style={styles.newPrice}>
            R$ {Number(promocao.precoPromocional).toFixed(2)}/{promocao.unidade}
          </Text>
        </View>
        <Text style={styles.description}>{promocao.descricao}</Text>
        <Text style={styles.validity}>Validade: {promocao.validade}</Text>
      </View>
    </View>
  );
}

function Header({
  title,
  subtitle,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
}) {
  // Cabecalho reutilizado nas telas para manter o app com o mesmo estilo.
  return (
    <View style={styles.header}>
      <Pressable style={styles.headerButton} onPress={onLeftPress}>
        <Ionicons name={leftIcon} size={24} color="#0f172a" />
      </Pressable>
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      {rightIcon ? (
        <Pressable style={styles.headerButton} onPress={onRightPress}>
          <Ionicons name={rightIcon} size={22} color="#0f172a" />
        </Pressable>
      ) : (
        <View style={styles.headerButton} />
      )}
    </View>
  );
}

function Input({ label, multiline, style, ...props }) {
  // Campo de texto reutilizavel para evitar repetir o mesmo codigo nos formularios.
  return (
    <View style={[styles.inputGroup, style]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function PrimaryButton({ label, icon, onPress }) {
  // Botao principal usado para acoes importantes, como salvar e publicar.
  return (
    <Pressable style={styles.primaryButton} onPress={onPress}>
      <Ionicons name={icon} size={19} color="#ffffff" />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function GhostButton({ label, icon, onPress }) {
  // Botao secundario usado para acoes de apoio, como buscar CEP ou escolher imagem.
  return (
    <Pressable style={styles.ghostButton} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#197278" />
      <Text style={styles.ghostButtonText}>{label}</Text>
    </Pressable>
  );
}

function TabButton({ label, active, onPress }) {
  // Botao das abas da area do lojista.
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text
        style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  flex: {
    flex: 1,
  },
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#197278',
    marginBottom: 18,
  },
  authTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0,
  },
  authSubtitle: {
    fontSize: 15,
    color: '#475569',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },
  header: {
    height: 72,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  screen: {
    padding: 16,
    paddingBottom: 30,
  },
  searchBox: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  categoryRow: {
    marginVertical: 14,
  },
  categoryButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#197278',
    borderColor: '#197278',
  },
  categoryText: {
    color: '#334155',
    fontWeight: '700',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  resultCount: {
    color: '#64748b',
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  cardImage: {
    height: 150,
    width: '100%',
    backgroundColor: '#e2e8f0',
  },
  cardBody: {
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#197278',
    backgroundColor: '#e6f3f1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeActive: {
    color: '#067647',
    backgroundColor: '#dcfae6',
  },
  badgeInactive: {
    color: '#b42318',
    backgroundColor: '#fee4e2',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
  },
  storeName: {
    color: '#475569',
    marginTop: 3,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 8,
  },
  oldPrice: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#d1495b',
  },
  description: {
    color: '#334155',
    lineHeight: 20,
  },
  validity: {
    marginTop: 8,
    color: '#64748b',
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  sidebar: {
    width: 280,
    height: '100%',
    backgroundColor: '#ffffff',
    paddingTop: 42,
    paddingHorizontal: 18,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 16,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  sidebarText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '700',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  tabs: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabButton: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  tabButtonActive: {
    backgroundColor: '#197278',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: 15,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: '#197278',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
  },
  ghostButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b6d6d3',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  ghostButtonText: {
    color: '#197278',
    fontWeight: '900',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowLarge: {
    flex: 1,
  },
  rowSmall: {
    width: 76,
  },
  manageItem: {
    minHeight: 92,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manageTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  manageInfo: {
    color: '#475569',
    marginTop: 4,
  },
  statusText: {
    marginTop: 5,
    fontWeight: '900',
  },
  activeText: {
    color: '#067647',
  },
  inactiveText: {
    color: '#b42318',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6f3f1',
  },
  iconButtonDanger: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee4e2',
  },
  previewImage: {
    width: '100%',
    height: 170,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#e2e8f0',
  },
});
