package com.bibliotech.rental.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestConfig {
	@Bean
	@LoadBalanced
	RestTemplate rest() {
		return new RestTemplate();
	}

	@Bean("directRestTemplate")
	RestTemplate directRestTemplate() {
		return new RestTemplate();
	}
}
