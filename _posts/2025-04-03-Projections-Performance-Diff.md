---
layout: post
title:  "Projections 성능 테스트"
categories: Article
---

# Projections 성능 테스트

저번에 Projections 성능에 대해서 공부를 했는데, 얼마나 차이가 나는지 궁금해졌다. 

#### 성능 테스트 기본 코드

###### DataInit	

```java
package com.example.projectiontest;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataInit implements CommandLineRunner {

	private final OrderRepository orderRepository;

	@Override
	public void run(String... args) {
		List<Order> orders = new ArrayList<>();
		for (int i = 0; i < 100000; i++) {
			orders.add(new Order(
				"ORD-" + i,
				"User" + i,
				OrderStatus.ORDERED,
				DeliveryStatus.PREPARING,
				LocalDateTime.now()
			));
		}
		orderRepository.saveAll(orders);
	}
}
```

###### DeliveryStatus

```java
package com.example.projectiontest;

public enum DeliveryStatus {
	PREPARING, SHIPPED, COMPLETED
}
```

###### Order

```java
package com.example.projectiontest;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "orders") // ✅ 예약어 피하기 위해 테이블 이름 명시
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order {
	@Id
	@GeneratedValue
	private Long id;

	private String orderNumber;
	private String userName;

	@Enumerated(EnumType.STRING)
	private OrderStatus orderStatus;

	@Enumerated(EnumType.STRING)
	private DeliveryStatus deliveryStatus;

	private LocalDateTime orderDate;

	public Order(String orderNumber, String userName, OrderStatus orderStatus, DeliveryStatus deliveryStatus, LocalDateTime orderDate) {
		this.orderNumber = orderNumber;
		this.userName = userName;
		this.orderStatus = orderStatus;
		this.deliveryStatus = deliveryStatus;
		this.orderDate = orderDate;
	}
}
```

###### OrderController

```java
package com.example.projectiontest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class OrderController {

	private final OrderService orderService;

	@GetMapping("/test")
	public void testPerformance() {
		long start1 = System.currentTimeMillis();
		orderService.findWithEntityMapping();
		long end1 = System.currentTimeMillis();
		System.out.println("Entity + map 방식: " + (end1 - start1) + "ms");

		long start2 = System.currentTimeMillis();
		orderService.findWithProjection();
		long end2 = System.currentTimeMillis();
		System.out.println("Projection 방식: " + (end2 - start2) + "ms");
	}
}
```

###### OrderRepository

```java
package com.example.projectiontest;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrderRepository extends JpaRepository<Order, Long> {
	@Query("SELECT new com.example.projectiontest.OrderSimpleProjection(o.orderNumber, o.userName) FROM Order o")
	List<OrderSimpleProjection> findWithProjection();
}
```

###### OrderService

```java
package com.example.projectiontest;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

	private final OrderRepository orderRepository;

	public List<OrderSimpleResponse> findWithEntityMapping() {
		List<Order> orders = orderRepository.findAll();
		return orders.stream()
			.map(o -> new OrderSimpleResponse(o.getOrderNumber(), o.getUserName()))
			.collect(Collectors.toList());
	}

	public List<OrderSimpleProjection> findWithProjection() {
		return orderRepository.findWithProjection();
	}
}
```

###### OrderSimpleProjection

```java
package com.example.projectiontest;

import lombok.Getter;

@Getter
public class OrderSimpleProjection {
	private String orderNumber;
	private String userName;

	public OrderSimpleProjection(String orderNumber, String userName) {
		this.orderNumber = orderNumber;
		this.userName = userName;
	}
}
```

###### OrderSimpleResponse

```java
package com.example.projectiontest;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OrderSimpleResponse {
	private String orderNumber;
	private String userName;
}
```

###### OrderStatus

```java
package com.example.projectiontest;

public enum OrderStatus {
	ORDERED, DELIVERED, CANCELLED
}
```



#### 성능 테스트 방법

- 유저를 10명부터, 100,000명까지 10배씩 늘려가며 테스트

| 유저         | Entity + map 방식 | Projection 방식 |
| ------------ | ----------------- | --------------- |
| 10 명        | 1519ms            | 303ms           |
| 100 명       | 1510ms            | 293ms           |
| 1,000 명     | 1524ms            | 311ms           |
| 10,000 명    | 1544ms            | 301ms           |
| 100,000 명   | 2041ms            | 395ms           |
| 200,000 명   | 2908ms            | 555ms           |
| 500,000 명   | 5260ms            | 1042ms          |
| 1,000,000 명 | 10369ms           | 2829ms          |

![output](/assets/img/posts/projections%20output.png)

- 평균적으로 **Projection이 5배 이상 빠름**
- 데이터가 많아질수록 **차이는 더 커짐**
- 특히 대용량 리스트 API에서 Projection 방식은 필수적임

### ✅ 결론

> "리스트 조회나 사용자-facing API에서 성능이 중요하다면,  
> **Entity 전체 조회는 피하고 DTO Projection을 사용할 것**"