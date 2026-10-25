import React from 'react';
import AppHeader from './AppHeader';

const IndividualProblemReview = ({ navigate, user, onLogout }) => {
  return (
    <div className="bg-surface text-on-surface font-body">
      {/* TopAppBar */}
      <AppHeader
        currentView="problem_review"
        navigate={navigate}
        user={user}
        onLogout={onLogout}
        customTitle="Problem Review"
        isSidebarPresent={true}
      />

      {/* SideNavBar (Problem Navigation Context) */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen p-4 space-y-2 w-64 bg-slate-50 pt-20">
        <div className="px-4 py-6 mb-4">
          <h2 className="font-headline text-lg font-extrabold text-indigo-700">Problem Review</h2>
          <p className="text-xs text-slate-500 font-medium">The Disciplined Curator</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 bg-white text-indigo-700 shadow-sm rounded-lg font-bold transition-all" href="#">
            <span className="material-symbols-outlined">description</span>
            <span>Current Problem</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:translate-x-1 transition-all rounded-lg" href="#">
            <span className="material-symbols-outlined">edit_note</span>
            <span>Revision Notes</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:translate-x-1 transition-all rounded-lg" href="#">
            <span className="material-symbols-outlined">code</span>
            <span>Code Editor</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:translate-x-1 transition-all rounded-lg" href="#">
            <span className="material-symbols-outlined">draw</span>
            <span>Visual Sketches</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:translate-x-1 transition-all rounded-lg" href="#">
            <span className="material-symbols-outlined">menu_book</span>
            <span>Resources</span>
          </a>
        </nav>
        <div className="pt-4 border-t-0 space-y-1">
          <button className="w-full text-left flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 rounded-lg transition-all">
            <span className="material-symbols-outlined">help</span>
            <span>Help Center</span>
          </button>
          <button className="w-full text-left flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 rounded-lg transition-all">
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="lg:pl-64 pt-20 min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto p-8">
          {/* Breadcrumbs / Hierarchy */}
          <div className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-400">
            <span className="material-symbols-outlined text-[18px]">folder_open</span>
            <span>Folders</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-indigo-600">Heaps / Priority Queue</span>
          </div>

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-3">Merge k Sorted Lists</h1>
              <div className="flex items-center gap-3">
                <span className="px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-error-container text-on-error-container">Hard</span>
                <a className="flex items-center gap-1.5 text-indigo-600 font-semibold text-sm hover:underline decoration-2 underline-offset-4" href="#">
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  LeetCode #23
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-surface-container-low hover:bg-surface-container-high transition-colors text-sm" onClick={() => navigate('revision_dashboard')}>
                Back to Queue
              </button>
              <button className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-surface-container-low hover:bg-surface-container-high transition-colors text-sm">
                Edit Problem
              </button>
              <button className="px-8 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95 text-sm">
                Mark as Reviewed
              </button>
            </div>
          </div>

          {/* Content Grid (Bento Style) */}
          <div className="grid grid-cols-12 gap-8">
            {/* Editorial Notes (Main Content) */}
            <div className="col-span-12 lg:col-span-8 space-y-8 text-left">
              <section className="bg-surface-container-lowest p-8 rounded-[1.5rem] shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs font-bold text-slate-400 tracking-[0.05em] uppercase font-label">Category</span>
                  <h3 className="font-headline text-lg font-bold text-on-surface">Editorial Notes</h3>
                </div>
                <div className="prose prose-slate max-w-none text-on-surface-variant leading-relaxed">
                  <h4 className="text-on-surface font-bold text-lg mb-2">The Intuition</h4>
                  <p className="mb-4">
                    This problem is a classic application of a <strong>Min-Heap</strong>. We have <em>k</em> sorted lists, and we need to merge them into one. At any point, the smallest element across all heads of the lists is the next candidate for our merged result.
                  </p>

                  <h4 className="text-on-surface font-bold text-lg mb-2">Complexity Analysis</h4>
                  <ul className="list-disc pl-5 mb-4 space-y-2">
                    <li><strong>Time:</strong> O(N log k) where N is total nodes and k is number of lists. Each insertion/extraction from heap takes log k.</li>
                    <li><strong>Space:</strong> O(k) for the priority queue to store one node from each list.</li>
                  </ul>

                  <h4 className="text-on-surface font-bold text-lg mb-2">Key Implementation Logic</h4>
                  <div className="bg-inverse-surface rounded-xl p-6 my-4 overflow-hidden">
                    <pre className="font-mono text-sm text-on-surface-variant overflow-x-auto"><code className="text-indigo-200">{`# Priority Queue approach
heap = []
for head in lists:
    if head:
        heapq.heappush(heap, (head.val, id(head), head))

dummy = ListNode(0)
curr = dummy

while heap:
    val, _, node = heapq.heappop(heap)
    curr.next = node
    curr = curr.next
    if node.next:
        heapq.heappush(heap, (node.next.val, id(node.next), node.next))` }</code></pre>
                  </div>
                  <p>
                    <em>Tip: Use the node ID or a custom comparator to handle duplicate values in the heap to avoid errors when comparing ListNode objects directly.</em>
                  </p>
                </div>
              </section>
            </div>

            {/* Sidebar / Secondary Content */}
            <div className="col-span-12 lg:col-span-4 space-y-8 text-left">
              {/* Conceptual Snapshot */}
              <section className="bg-surface-container-lowest p-6 rounded-[1.5rem] shadow-sm border border-outline-variant/10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-slate-400 tracking-[0.05em] uppercase font-label">Visual</span>
                  <h3 className="font-headline text-lg font-bold text-on-surface">Conceptual Snapshot</h3>
                </div>
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 group relative cursor-zoom-in">
                  <img alt="Conceptual logic drawing" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmFZ1j2hCjq4GqNV-DkxosyfyiGE7Fe-SVrc9-hV3QLJFvYLlknJK-HdZzr_Fv-uWZmI-s_pfYFa-e-Oz7_6fqNn4p0fJ2fIqMiGeXrkYPrmnvFlKINpmOkMJs_VPs-0gNJrkPy0xvopYihF5yb-5h2X1SvZwucXNzvK3KtWaBe6nb0tL6Tzzi1n4PiO7ANxk8_Dh-ozxBXGDg0xHHtHbPa6euj94j7B24EeWGIGioMYxsTkVd0jfXWIobfjGKJMOccb9OBwk6KTOz" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-on-surface/5 backdrop-blur-[2px]">
                    <span className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-bold text-on-surface flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-[16px]">fullscreen</span> View Larger
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500 italic text-center">Sketch of priority queue state transitions</p>
              </section>

              {/* Problem Stats / Context */}
              <section className="bg-surface-container-low p-6 rounded-[1.5rem]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-slate-400 tracking-[0.05em] uppercase font-label">Insights</span>
                  <h3 className="font-headline text-lg font-bold text-on-surface">Review History</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Last Reviewed</span>
                    <span className="text-sm font-semibold text-on-surface">12 days ago</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Confidence Score</span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      <span className="w-2 h-2 rounded-full bg-primary/20"></span>
                      <span className="w-2 h-2 rounded-full bg-primary/20"></span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Total Attempts</span>
                    <span className="text-sm font-semibold text-on-surface">3 times</span>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-200/50">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Suggested Similar Problems</p>
                    <ul className="space-y-2">
                      <li>
                        <a className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors" href="#">Merge Two Sorted Lists (Easy)</a>
                      </li>
                      <li>
                        <a className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors" href="#">Find Median from Data Stream (Hard)</a>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Progress Ribbon */}
              <div className="bg-tertiary-fixed rounded-[1.25rem] p-5 border-l-4 border-tertiary">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                  <div>
                    <p className="text-xs font-bold text-on-tertiary-fixed-variant uppercase tracking-wider">Review Streak</p>
                    <p className="text-sm font-bold text-on-tertiary-fixed">4 consecutive days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Contextual FAB (Only visible if action is relevant) */}
      <div className="fixed bottom-8 right-8 z-[70]">
        <button className="bg-indigo-700 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-2 hover:bg-indigo-800 transition-all hover:-translate-y-1 active:scale-95 group">
          <span className="material-symbols-outlined">edit</span>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-bold">Quick Edit Notes</span>
        </button>
      </div>
    </div>
  );
};

export default IndividualProblemReview;
