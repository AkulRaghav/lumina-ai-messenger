/**
 * DAG Task Scheduler — Directed Acyclic Graph execution engine.
 *
 * Used by: Apache Airflow, Gradle, Bazel, Terraform, GitHub Actions.
 * Use case: Orchestrating complex message delivery pipelines where
 * some tasks depend on others (persist → broadcast → embed → notify).
 *
 * Features:
 * - Topological sort for execution order
 * - Parallel execution of independent tasks
 * - Cycle detection
 */

type TaskFn = () => Promise<void>;

interface TaskNode {
  id: string;
  fn: TaskFn;
  dependencies: string[];
  status: 'pending' | 'running' | 'done' | 'failed';
}

export class DAGScheduler {
  private tasks = new Map<string, TaskNode>();

  addTask(id: string, fn: TaskFn, dependencies: string[] = []): void {
    this.tasks.set(id, { id, fn, dependencies, status: 'pending' });
  }

  /** Detect cycles using DFS coloring. */
  hasCycle(): boolean {
    const white = new Set(this.tasks.keys());
    const gray = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      white.delete(nodeId);
      gray.add(nodeId);
      const node = this.tasks.get(nodeId)!;
      for (const dep of node.dependencies) {
        if (gray.has(dep)) return true; // Back edge = cycle
        if (white.has(dep) && dfs(dep)) return true;
      }
      gray.delete(nodeId);
      return false;
    };

    for (const id of this.tasks.keys()) {
      if (white.has(id) && dfs(id)) return true;
    }
    return false;
  }

  /** Execute all tasks respecting dependency order, parallelizing where possible. */
  async execute(): Promise<Map<string, 'done' | 'failed'>> {
    if (this.hasCycle()) throw new Error('DAG contains a cycle');

    const results = new Map<string, 'done' | 'failed'>();

    while (results.size < this.tasks.size) {
      // Find ready tasks (all deps satisfied)
      const ready: TaskNode[] = [];
      for (const [id, task] of this.tasks) {
        if (task.status !== 'pending') continue;
        const depsOk = task.dependencies.every(
          (d) => this.tasks.get(d)?.status === 'done',
        );
        if (depsOk) ready.push(task);
      }

      if (ready.length === 0 && results.size < this.tasks.size) {
        throw new Error('Deadlock: no ready tasks but not all complete');
      }

      // Execute ready tasks in parallel
      await Promise.all(
        ready.map(async (task) => {
          task.status = 'running';
          try {
            await task.fn();
            task.status = 'done';
            results.set(task.id, 'done');
          } catch {
            task.status = 'failed';
            results.set(task.id, 'failed');
          }
        }),
      );
    }
    return results;
  }
}
