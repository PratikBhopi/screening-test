// Simple in-memory queue for async bulk imports.
// In production I'd swap this for BullMQ or SQS — persistent, distributed, with retries.
// For now a plain array is fine since we're single-instance and job loss on restart is acceptable.
// The tradeoff: if the server crashes mid-import, queued jobs stay PENDING in the DB forever.

const jobQueue = [];
let isProcessing = false;

// Lazy-require to avoid a circular dep: importQueue → importJob.service → importQueue
function getService() {
  return require('../services/importJob.service');
}

// Push a jobId onto the queue. I use setImmediate so the 202 response goes out
// to the client before I start doing any real work.
function enqueue(jobId) {
  jobQueue.push(jobId);
  console.log(`[Queue] Enqueued job ${jobId}. Depth: ${jobQueue.length}`);

  if (!isProcessing) {
    setImmediate(processNext);
  }
}

// Process one job at a time. I use setImmediate between jobs so the event loop
// stays free for incoming HTTP requests — I'm not blocking it.
// If a job crashes unexpectedly I mark it FAILED and move on so one bad file
// doesn't stall everything behind it.
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
