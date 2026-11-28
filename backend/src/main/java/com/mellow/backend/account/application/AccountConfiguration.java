package com.mellow.backend.account.application;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
class AccountConfiguration {

    @Bean
    Clock accountClock() {
        return Clock.systemUTC();
    }
}
