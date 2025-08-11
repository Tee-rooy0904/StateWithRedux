import { configureStore, createSlice, nanoid } from "@reduxjs/toolkit";
import * as Device from "expo-device";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View
} from "react-native";
import {
  Appbar,
  Avatar,
  Banner,
  Button,
  Card,
  Divider,
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { Provider as ReduxProvider, useDispatch, useSelector } from "react-redux";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    darkMode: false,
    showBanner: true,
    bannerMessage:
      "This screen demonstrates Redux state, responsive layout, and native modules (Haptics, Device).",
  },
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
    },
    dismissBanner(state) {
      state.showBanner = false;
    },
    showBannerWithMessage(state, action) {
      state.showBanner = true;
      state.bannerMessage = action.payload;
    },
  },
});

// Todo slice to demonstrate lists and immutable updates
const todosSlice = createSlice({
  name: "todos",
  initialState: { items: [] },
  reducers: {
    addTodo: {
      reducer(state, action) {
        state.items.unshift(action.payload);
      },
      prepare(title) {
        return {
          payload: {
            id: nanoid(),
            title,
            done: false,
            createdAt: Date.now(),
          },
        };
      },
    },
    toggleTodo(state, action) {
      const t = state.items.find((x) => x.id === action.payload);
      if (t) {
        t.done = !t.done;
        state.items = [
          ...state.items.filter((todo) => !todo.done),
          ...state.items.filter((todo) => todo.done),
        ];
      }
    },
    removeTodo(state, action) {
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
    clearTodos(state) {
      state.items = [];
    },
  },
});

const { toggleDarkMode, dismissBanner, showBannerWithMessage } = uiSlice.actions;
const { addTodo, toggleTodo, removeTodo, clearTodos } = todosSlice.actions;

const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    todos: todosSlice.reducer,
  },
});



export default function App() {
  return (
    <ReduxProvider store={store}>
      <ThemedApp />
    </ReduxProvider>
  );
}

function ThemedApp() {
  const darkMode = useSelector((s) => s.ui.darkMode);
  const theme = useMemo(
    () => (darkMode ? MD3DarkTheme : MD3LightTheme),
    [darkMode]
  );
  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={{ flex: 1 }}>
        <AppScaffold />
      </SafeAreaView>
    </PaperProvider>
  );
}



function AppScaffold() {
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { showBanner, bannerMessage } = useSelector((s) => s.ui);

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <Appbar.Header>
        <Appbar.Content
          title="Expo + Redux Demo"
          subtitle={`Running on ${Device.osName ?? "Unknown OS"}`}
        />
        <DarkModeSwitch />
      </Appbar.Header>

      {showBanner && (
        <Banner
          visible
          actions={[{ label: "Got it", onPress: () => dispatch(dismissBanner()) }]}
          icon={({ size }) => (
            <Avatar.Icon size={size} icon="information-outline" />
          )}
        >
          {bannerMessage}
        </Banner>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          isTablet && styles.contentTablet,
          { paddingBottom: 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.column, isTablet && styles.columnTablet]}>
          <TodosCard />
          <LibraryCard />
        </View>
      </ScrollView>

      <Appbar style={styles.footer}>
        <Appbar.Action icon="github" accessibilityLabel="GitHub" onPress={() => {}} />
        <Appbar.Content
          title="Footer"
          subtitle={Platform.select({
            ios: "iOS",
            android: "Android",
            default: "Web",
          })}
        />
      </Appbar>
    </View>
  );
}

function DarkModeSwitch() {
  const dispatch = useDispatch();
  const darkMode = useSelector((s) => s.ui.darkMode);
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", paddingRight: 12 }}
    >
      <Text accessibilityRole="header" style={{ marginRight: 8 }}>
        {darkMode ? "Dark" : "Light"}
      </Text>
      <Switch
        value={darkMode}
        onValueChange={() => dispatch(toggleDarkMode())}
        accessibilityLabel="Toggle dark mode"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      />
    </View>
  );
}



function TodosCard() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.todos.items);
  const [title, setTitle] = useState("");

  const undone = items.filter((t) => !t.done);
  const done = items.filter((t) => t.done);

  const handleAddTodo = () => {
    if (!title.trim()) return;
    dispatch(addTodo(title.trim()));
    dispatch(showBannerWithMessage("Todo added successfully!"));
    setTitle("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderTodo = (item) => (
    <Card style={{ marginBottom: 8 }}>
      <Card.Title
        title={item.title}
        subtitle={new Date(item.createdAt).toLocaleString()}
        left={(props) => (
          <Avatar.Icon
            {...props}
            icon={item.done ? "check" : "circle-outline"}
          />
        )}
      />
      <Card.Actions>
        <Button onPress={() => dispatch(toggleTodo(item.id))}>
          {item.done ? "Undo" : "Done"}
        </Button>
        <Button
          onPress={() => dispatch(removeTodo(item.id))}
          textColor="#d11"
        >
          Remove
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Todo's"
        subtitle="Active on top, Completed below"
        left={(props) => (
          <Avatar.Icon {...props} icon="check-circle-outline" />
        )}
      />
      <Card.Content>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={{ flex: 1 }}
            label="What needs doing?"
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={handleAddTodo}
            returnKeyType="done"
          />
          <Button mode="contained" onPress={handleAddTodo}>
            Add
          </Button>
        </View>
        <Divider style={{ marginVertical: 12 }} />

        <Text style={{ fontWeight: "bold", marginBottom: 6 }}>Active</Text>
        {undone.length > 0 ? (
          undone.map(renderTodo)
        ) : (
          <Text style={{ marginBottom: 12 }}>No active todos</Text>
        )}
        <Divider style={{ marginVertical: 12 }} />
        <Text style={{ fontWeight: "bold", marginBottom: 6 }}>Completed</Text>
        {done.length > 0 ? (
          done.map(renderTodo)
        ) : (
          <Text>No completed todos</Text>
        )}
        
        {items.length > 0 && (
          <Button style={{ marginTop: 8 }} onPress={() => dispatch(clearTodos())}>
            Clear All
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}



function LibraryCard() {
  return (
    <Card style={styles.card}>
      <Card.Title
        title="Third-party UI library"
        subtitle="React Native Paper components"
        left={(props) => <Avatar.Icon {...props} icon="palette" />}
      />
      <Card.Content>
        <Text>
          This app uses{" "}
          <Text style={{ fontWeight: "bold" }}>react-native-paper</Text> for
          theming, typography, and accessible UI primitives. Try toggling dark
          mode above and notice automatic color adaptation.
        </Text>
        <View style={{ height: 12 }} />
        <Text>Other popular libraries you can explore:</Text>
        <View style={{ height: 6 }} />
        <Text>• React Navigation — screens & stacks</Text>
        <Text>• React Native Elements — alternative UI kit</Text>
        <Text>• Reanimated/Gesture Handler — high-performance gestures</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  containerTablet: { paddingHorizontal: 12 },
  content: { flex: 1, padding: 12 },
  contentTablet: { flexDirection: "row", gap: 12 },
  column: { flex: 1 },
  columnTablet: { flex: 1 },
  card: { marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  footer: { justifyContent: "center" },
});
