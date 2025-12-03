import path from 'path'
import { promises as fs } from 'fs'
import { prisma } from '../prisma'

export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameType = 'quiz'

export type Question = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation?: string
}

export type GameContent = {
  key: string
  title: string
  description: string
  type: GameType
  difficulty: Difficulty
  questions: Question[]
}

export type PublicQuestion = Omit<Question, 'correctIndex'>
export type PublicGameContent = Omit<GameContent, 'questions'> & { questions: PublicQuestion[] }

const CONTENT_DIR = path.join(__dirname, '..', 'games', 'content')

export async function loadAllGameContents(): Promise<GameContent[]> {
  const files = await fs.readdir(CONTENT_DIR)
  const jsonFiles = files.filter((f) => f.endsWith('.json'))
  const contents: GameContent[] = []
  for (const file of jsonFiles) {
    const full = path.join(CONTENT_DIR, file)
    const raw = await fs.readFile(full, 'utf8')
    contents.push(JSON.parse(raw) as GameContent)
  }
  return contents
}

export async function loadGameContent(key: string): Promise<GameContent | null> {
  const file = path.join(CONTENT_DIR, `${key}.json`)
  try {
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw) as GameContent
  } catch {
    return null
  }
}

export function toPublic(content: GameContent): PublicGameContent {
  return {
    key: content.key,
    title: content.title,
    description: content.description,
    type: content.type,
    difficulty: content.difficulty,
    questions: content.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      ...(q.explanation ? { explanation: q.explanation } : {}),
    })),
  }
}

export function computeScore(content: GameContent, answers: Record<string, number>): number {
  const perCorrect = 10
  const completionBonus = 20
  const multiplier = content.difficulty === 'hard' ? 2 : content.difficulty === 'medium' ? 1.5 : 1
  let correct = 0
  for (const q of content.questions) {
    const a = answers[q.id]
    if (typeof a === 'number' && a === q.correctIndex) correct += 1
  }
  const base = correct * perCorrect
  const completed = Object.keys(answers).length >= content.questions.length
  const total = (base + (completed ? completionBonus : 0)) * multiplier
  return Math.round(total)
}

export async function ensureGameRecords(contents: GameContent[]) {
  for (const g of contents) {
    await prisma.game.upsert({
      where: { key: g.key },
      update: { title: g.title, description: g.description, type: g.type },
      create: { key: g.key, title: g.title, description: g.description, type: g.type },
    })
  }
}
