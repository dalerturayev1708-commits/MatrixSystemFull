import {
  Zap, Cpu, RotateCcw, BookOpen, GraduationCap, Library, Target, Award, Crown, Timer, Flame, CalendarCheck, Route, Shapes, Star, Sparkles,
} from 'lucide-react';

const MAP = { Zap, Cpu, RotateCcw, BookOpen, GraduationCap, Library, Target, Award, Crown, Timer, Flame, CalendarCheck, Route, Shapes, Star, Sparkles };

export default function AchievementIcon({ name, size = 19 }) {
  const Icon = MAP[name] || Award;
  return <Icon size={size} />;
}
