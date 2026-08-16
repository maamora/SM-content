package com.maamora.studio.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

@Configuration
@EnableAsync
public class CreativeAsyncConfig {

    @Bean(name = "creativeTaskExecutor")
    public Executor creativeTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(20);
        executor.setThreadNamePrefix("studio-creative-");
        AtomicInteger sequence = new AtomicInteger();
        ThreadFactory daemonFactory = runnable -> {
            Thread thread = new Thread(runnable, "studio-creative-" + sequence.incrementAndGet());
            thread.setDaemon(true);
            return thread;
        };
        executor.setThreadFactory(daemonFactory);
        executor.setWaitForTasksToCompleteOnShutdown(false);
        executor.setAwaitTerminationSeconds(5);
        executor.initialize();
        return executor;
    }
}
