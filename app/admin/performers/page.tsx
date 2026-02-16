import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Trophy, Clock, CheckCircle, AlertTriangle, Zap, ArrowLeft, Award } from "lucide-react"

export default async function PerformersPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') redirect("/")

  const interns = await prisma.user.findMany({
    where: { role: 'INTERN', status: 'APPROVED' },
    include: {
      assignedTasks: {
        include: {
          timeLogs: true
        }
      }
    }
  })

  // Advanced Scoring Algorithm
  const performers = interns.map(intern => {
    let completed = 0;
    let totalSeconds = 0;
    let reassignedCount = 0;
    let promptStarts = 0;
    let totalResponseTime = 0; // seconds
    let responseCount = 0;

    intern.assignedTasks.forEach(task => {
      // 1. Completion
      if (task.status === 'COMPLETED') completed++;

      // 2. Reassigned Penalty
      if (task.title.includes("(Reassigned)")) reassignedCount++;

      // 3. Work Hours - Robust Calculation with Interval Merging
      // This fixes "inflation" bugs where multiple active logs overlap or run too long
      const activeLogs = task.timeLogs.filter((l: any) => l.type === 'WORK');
      const ranges: { start: number, end: number }[] = [];

      activeLogs.forEach((log: any) => {
        const start = new Date(log.startTime).getTime();
        let end = log.endTime ? new Date(log.endTime).getTime() : new Date().getTime();
        
        // Anti-Inflation: Ignore "Ghost" logs (open but task not in progress)
        if (!log.endTime && task.status !== 'IN_PROGRESS') return;

        // Anti-Inflation: Cap single sessions at 12 hours (43200000 ms)
        if (end - start > 43200000) end = start + 43200000;

        if (end > start) {
            ranges.push({ start, end });
        }
      });

      // Sort by start time
      ranges.sort((a, b) => a.start - b.start);

      const mergedRanges: { start: number, end: number }[] = [];
      if (ranges.length > 0) {
        let current = ranges[0];
        
        for (let i = 1; i < ranges.length; i++) {
            const next = ranges[i];
            if (next.start < current.end) {
                // Overlap detected: extend current end if next goes further
                current.end = Math.max(current.end, next.end);
            } else {
                // No overlap: push current and start new
                mergedRanges.push(current);
                current = next;
            }
        }
        mergedRanges.push(current);
      }

      // Sum strictly non-overlapping time
      mergedRanges.forEach(range => {
        totalSeconds += (range.end - range.start) / 1000;
      });

      // 4. Promptness / Response Speed
      // Check first log vs creation time
      if (activeLogs.length > 0) {
        // Sort specifically to find the very first action
        const firstLog = [...activeLogs].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
        const responseTime = (new Date(firstLog.startTime).getTime() - new Date(task.createdAt).getTime()) / 1000;
        
        // If response time is positive (log after creation)
        if (responseTime > 0) {
            totalResponseTime += responseTime;
            responseCount++;
            
            // Bonus for starting within 30 mins (1800 seconds)
            if (responseTime <= 1800) {
                promptStarts++;
            }
        }
      }
    });

    const hours = Math.floor(totalSeconds / 3600);
    const avgResponseTimeMinutes = responseCount > 0 ? Math.floor((totalResponseTime / responseCount) / 60) : 0;

    // SCORING FORMULA
    // - Completed Task: 25 points
    // - Work Hour: 2 points (reward effort)
    // - Prompt Start: 5 points (reward quick action)
    // - Reassigned: -15 points (penalty for missing deadline)
    // - Fast Responder Bonus: If avg response < 15 mins, +10 points flat bonus
    let score = (completed * 25) + (hours * 2) + (promptStarts * 5) - (reassignedCount * 15);
    
    if (avgResponseTimeMinutes > 0 && avgResponseTimeMinutes < 15) {
        score += 10;
    }

    return {
      id: intern.id,
      name: intern.name,
      email: intern.email,
      stats: {
        completed,
        hours,
        reassignedCount,
        promptStarts,
        avgResponseTimeMinutes
      },
      score: Math.max(0, parseFloat(score.toFixed(1))) // No negative scores
    };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <a href="/admin" className="p-3 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </a>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 flex items-center gap-3">
            <Trophy className="text-yellow-500" /> Top Performers Leaderboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Ranking based on efficiency, dedication, and punctuality.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {performers.map((intern, index) => (
          <div key={intern.id} className="relative bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
            {/* Rank Badge */}
            <div className={`absolute top-0 left-0 w-2 h-full ${
               index === 0 ? "bg-yellow-400" :
               index === 1 ? "bg-gray-300" :
               index === 2 ? "bg-amber-600" :
               "bg-blue-500/50"
            }`} />
            
            <div className="flex flex-col md:flex-row items-center gap-6 pl-4">
              {/* Rank Icon */}
              <div className="shrink-0 flex flex-col items-center justify-center w-16">
                 {index < 3 ? (
                    <Trophy size={40} className={
                        index === 0 ? "text-yellow-400 drop-shadow-lg" :
                        index === 1 ? "text-gray-400" :
                        "text-amber-600"
                    } />
                 ) : (
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                 )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{intern.name}</h3>
                <p className="text-sm text-gray-500">{intern.email}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                   {index === 0 && (
                     <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-full flex items-center gap-1">
                        <Award size={12} /> Top Performer
                     </span>
                   )}
                   {intern.stats.avgResponseTimeMinutes < 15 && (
                     <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full flex items-center gap-1">
                        <Zap size={12} /> Fast Responder ({intern.stats.avgResponseTimeMinutes}m avg)
                     </span>
                   )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto text-center md:text-right bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                 <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase font-bold">Score</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{intern.score}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase font-bold flex items-center justify-center md:justify-end gap-1"><CheckCircle size={10} /> Completed</p>
                    <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{intern.stats.completed}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase font-bold flex items-center justify-center md:justify-end gap-1"><Clock size={10} /> Hours</p>
                    <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{intern.stats.hours}h</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase font-bold text-red-500 flex items-center justify-center md:justify-end gap-1"><AlertTriangle size={10} /> Reassigned</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{intern.stats.reassignedCount}</p>
                 </div>
              </div>
            </div>
            
            {/* Score Breakdown Tooltip/Detail - Visible on hover or always small */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400 px-4">
                <span>Score Breakdown:</span>
                <span>• Task Completion: {intern.stats.completed} × 25pts</span>
                <span>• Work Hours: {intern.stats.hours} × 2pts</span>
                <span>• Prompt Starts: {intern.stats.promptStarts} × 5pts</span>
                <span className="text-red-400">• Reassigned Penalty: -{intern.stats.reassignedCount * 15}pts</span>
            </div>
          </div>
        ))}

        {performers.length === 0 && (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500">No approved interns found to rank.</p>
            </div>
        )}
      </div>
    </div>
  )
}
