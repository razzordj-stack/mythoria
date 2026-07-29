import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    narrative: { type: "string", minLength: 80, maxLength: 4000 },
    choices: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string", minLength: 2, maxLength: 180 },
    },
    scene: { type: "string", minLength: 2, maxLength: 160 },
  },
  required: ["narrative", "choices", "scene"],
} as const;

type AdventureResponse = {
  narrative: string;
  choices: string[];
  scene: string;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Der KI-Spielleiter ist noch nicht konfiguriert." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    typeof body.sessionId !== "string" ||
    typeof body.action !== "string"
  ) {
    return Response.json(
      { error: "Sitzung und Handlung werden benötigt." },
      { status: 400 },
    );
  }

  const sessionId = body.sessionId;
  const action = body.action.trim();
  if (!isUuid(sessionId) || action.length < 2 || action.length > 2000) {
    return Response.json(
      { error: "Die Handlung muss zwischen 2 und 2.000 Zeichen lang sein." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return Response.json(
      { error: "Du bist nicht angemeldet." },
      { status: 401 },
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("adventure_sessions")
    .select("id,character_id,status")
    .eq("id", sessionId)
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (sessionError || !session) {
    return Response.json(
      { error: "Die aktive Chronik wurde nicht gefunden." },
      { status: 404 },
    );
  }

  const [
    { data: character },
    { data: inventory },
    { data: questRows },
    { data: messageRows },
  ] = await Promise.all([
    supabase
      .from("characters")
      .select(
        "name,race,character_class,level,health,max_health,mana,max_mana,gold,strength,dexterity,intelligence,constitution,wisdom,charisma",
      )
      .eq("id", session.character_id)
      .eq("user_id", authData.user.id)
      .single(),
    supabase
      .from("inventory_items")
      .select("name,item_type,quantity,is_equipped,attack_bonus,defense_bonus")
      .eq("character_id", session.character_id)
      .eq("user_id", authData.user.id)
      .limit(30),
    supabase
      .from("character_quests")
      .select("status,progress,quests(title,description,difficulty)")
      .eq("character_id", session.character_id)
      .eq("user_id", authData.user.id)
      .eq("status", "active")
      .limit(10),
    supabase
      .from("adventure_messages")
      .select("role,content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!character) {
    return Response.json(
      { error: "Der Charakterkontext konnte nicht geladen werden." },
      { status: 500 },
    );
  }

  const history = (messageRows ?? []).reverse().map((message) => ({
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
  }));
  history.push({ role: "user", content: action });

  const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
      instructions: buildInstructions(
        character,
        inventory ?? [],
        questRows ?? [],
      ),
      input: history,
      text: {
        format: {
          type: "json_schema",
          name: "mythoria_adventure_turn",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    }),
  });

  const openAIData = (await openAIResponse
    .json()
    .catch(() => ({}))) as OpenAIResponse;
  if (!openAIResponse.ok) {
    console.error(
      "OpenAI adventure response failed",
      openAIResponse.status,
      openAIData.error?.message,
    );
    return Response.json(
      {
        error:
          "Der KI-Spielleiter ist gerade nicht erreichbar. Deine Handlung wurde nicht gespeichert.",
      },
      { status: 502 },
    );
  }

  const outputText = extractOutputText(openAIData);
  const result = parseAdventureResponse(outputText);
  if (!result) {
    console.error("OpenAI adventure response had an invalid structure");
    return Response.json(
      {
        error:
          "Die Antwort des KI-Spielleiters war ungültig. Bitte versuche es erneut.",
      },
      { status: 502 },
    );
  }

  const structuredData = {
    kind: "adventure_turn",
    choices: result.choices,
    scene: result.scene,
  };
  const { error: saveError } = await supabase.rpc("record_adventure_turn", {
    p_session_id: sessionId,
    p_action: action,
    p_response: result.narrative,
    p_structured_data: structuredData,
  });
  if (saveError) {
    console.error("Adventure turn persistence failed", saveError.message);
    return Response.json(
      { error: "Die neue Szene konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }

  return Response.json({
    response: result.narrative,
    choices: result.choices,
    scene: result.scene,
  });
}

function buildInstructions(
  character: unknown,
  inventory: unknown[],
  quests: unknown[],
) {
  return [
    "Du bist der deutschsprachige Dungeon Master von Mythoria, einem atmosphärischen Fantasy-Rollenspiel.",
    "Setze die Chronik kohärent fort, reagiere konkret auf die letzte Spielerhandlung und erfinde keine bereits geschehenen Ereignisse um.",
    "Schreibe bildhaft in der zweiten Person, 2 bis 5 kurze Absätze. Entscheide nie anstelle der Spielfigur.",
    "Biete genau drei unterschiedliche, unmittelbar ausführbare Handlungsoptionen an. Freie Eingaben bleiben jederzeit möglich.",
    "Verändere keine Charakterwerte, Gegenstände oder Quests. Diese Daten dienen in diesem Schritt ausschließlich als Kontext.",
    `Charakter: ${JSON.stringify(character)}`,
    `Inventar: ${JSON.stringify(inventory)}`,
    `Aktive Quests: ${JSON.stringify(quests)}`,
  ].join("\n");
}

function extractOutputText(response: OpenAIResponse) {
  if (typeof response.output_text === "string") return response.output_text;
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string")
        return content.text;
    }
  }
  return "";
}

function parseAdventureResponse(value: string): AdventureResponse | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !isRecord(parsed) ||
      typeof parsed.narrative !== "string" ||
      typeof parsed.scene !== "string"
    )
      return null;
    if (
      !Array.isArray(parsed.choices) ||
      parsed.choices.length !== 3 ||
      !parsed.choices.every((choice) => typeof choice === "string")
    )
      return null;
    const narrative = parsed.narrative.trim();
    const scene = parsed.scene.trim();
    const choices = parsed.choices.map((choice) => choice.trim());
    if (
      narrative.length < 1 ||
      narrative.length > 8000 ||
      scene.length < 1 ||
      choices.some((choice) => choice.length < 1 || choice.length > 180)
    )
      return null;
    return { narrative, scene, choices };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
