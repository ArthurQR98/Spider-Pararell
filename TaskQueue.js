export class TaskQueue {
    constructor(concurrency) {
        this.taskQueue = [];
        this.consumerQueue = [];

        // spawn consumers
        for (let i = 0; i < concurrency; i++) {
            this.consumer()
        }
    }

    async consumer() {
        while (true) {
            try {
                const task = await this.getNextTask();
                await task()
            } catch (err) {
                console.error(err);
            }
        }
    }

    getNextTask() {
        return new Promise((resolve) => {
            if (this.taskQueue.length !== 0) {
                return resolve(this.taskQueue.shift())
            }
            this.consumerQueue.push(resolve) // se queda en espera
        })
    }

    runTask(task) {
        return new Promise((resolve, reject) => {
            const taskWrapper = () => {
                const taskPromise = task();
                taskPromise.then(resolve, reject)
                return taskPromise;
            }
            if (this.consumerQueue.length !== 0) {
                const consumer = this.consumerQueue.shift();
                consumer(taskWrapper);
            } else {
                this.taskQueue.push(taskWrapper);
            }
        })
    }
}