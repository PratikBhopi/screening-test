/*
 * In-memory job queue for bulk import processing.
 *
 * Ideally this would be BullMQ (Redis) or SQS in production — persistent,
 * distributed, with retries built in. For this project, a plain array works
 * fine: jobs are processed one at a time, the server stays responsive, and
 * we're not running multiple instances.
 *
 * The main tradeoff: if the server restarts mid-import, any queued jobs are
 * lost. The ImportJob row stays in the DB as PENDING forever. Acceptable here,
 * but something you'd fix before going to production.
 */

const jobQueue = [];
let isProcessing = false;

// Lazy-require breaks the circular dep: importQueue → importJob.service → importQueue.
// If we required it at the top of the file, Node would get a half-initialized module.
function getService() {
  return require('../services/importJob.service');
}

/**
 * Pushes a jobId onto the queue.
 * If the worker isn't already running, kicks it off via setImmediate so the
 * 202 response goes out to the client before we start doing any real work.
 *
 * @param {string} jobId
 */
function enqueue(jobId) {
  jobQueue.push(jobId);
  console.log(`[Queue] Enqueued job ${jobId}. Depth: ${jobQueue.length}`);

  if (!isProcessing) {
    setImmediate(processNext);
  }
}

/*
 * Pulls the next job off the queue and processes it.
 * Uses setImmediate between jobs so other I/O (incoming HTTP requests etc.)
 * gets a chance to run — we're not blocking the event loop.
 *
 * If a job throws unexpectedly (not a validation error — those are handled
 * inside the service), we mark it FAILED in the DB and move on. One bad
 * file shouldn't stall every other job behind it.
 */
async function processNext() {
  if (jobQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const jobId = jobQueue.shift();

  console.log(`[Queue] Processing job ${jobId}. Remaining: ${jobQueue.length}`);

  try {
    await getService().processJobById(jobId);
    console.log(`[Queue] Job ${jobId} done.`);
  } catch (err) {
    console.error(`[Queue] Job ${jobId} crashed:`, err.message);
    try {
      const repo = require('../repositories/importJob.repository');
      await repo.updateStatus(jobId, {
        status: 'FAILED',
        completedAt: new Date(),
        errorLog: [{ row: 0, field: 'system', message: err.message }]
      });
    } catch (updateErr) {
      console.error(`[Queue] Couldn't mark job ${jobId} as FAILED:`, updateErr.message);
    }
  }

  setImmediate(processNext);
}

function getQueueDepth() {
  return jobQueue.length;
}

module.exports = { enqueue, getQueueDepth };
