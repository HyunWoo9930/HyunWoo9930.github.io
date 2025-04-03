---
layout: post
title:  "Java Projections"
categories: Article
---

# Java Projections

![](/assets/img/posts/projections.png)

#### What is projections?

Projections란 **DB에서 필요한 속성**(Table에서 원하는 컬럼)만을 조회하는 것을 의미한다.

ORM인 `JPA` 에서 Srping Data JPA 를 활용하여 여러 방법으로 사용가능하다.

#### WHY?

서버 개발에서 가장 중요한것은 **"일관된 반응과 그에따른 최적화"** 이다.

Projection을 사용하면 불필요한 컬럼의 조회를 지양하고, 최적화된 API를 설계할수 있다.



#### 예시 주문 테이블

```java
@Entity
public class Order{
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long orderSeq;

    @OneToOne
    private Shop shop;

    private OrderType orderType;

    private OrderStatus orderStatus;

    private DeliveryStatus deliveryStatus;

    private ReciverInfo reciverInfo;
}
```



##### Native Query를 이용하여 조회하는 방법

```java
@Query(value="select o.orderStatus, o.orderType, o.deliveryStatus from Order as o Where o.orderSeq = ?",nativeQuery=true)
Order findByNativeQuery(Long orderSeq);

@Query(value="SELECT o.orderStatus, o.orderType, o.deliveryStatus" +
        "FROM Order as o " +
        "WHERE o.orderSeq = ?"
        ,nativeQuery=true)
OrderResponseDTO findByNativeQuery(Long orderSeq);
```

위 방법은 Projection을 사용하지 않고 DTO를 이용한 Native Query이다. 

> **💡 Native Query**
>
> - NativeQuery의 경우 실무에서 사용할 이유도 없을 뿐더러 협업 관계에서 비효율적임
> - NativeQuery를 만약 직접 구현해야하는 JDBCTemplate과 같은 외부 라이브러리를 사용하는 것을 권장
> - 또한, 최근 queryDsl의 등장으로 복잡한 쿼리를 풀어낼 수 있다는 점이 장점으로 다가온다.
>   JPA Criteria를 기반으로 도메인 주도 설계(DDD)의 명세(Specification)를 지원하고
>   JPA Criteria를 기반으로 코드 구성이 되기 때문에 진짜 실무에서 절대로 쓸일이 없다



##### Projection - 인터페이스 기반 Close Projection

조회를 원하는 속성들을 집합으로 인터페이스를 생성하여 간편하게 이용할 수 있는 방법이다.

```java
// 주문의 정보, 배달정보만을 조회하고 싶을 떄
public interface ODStatusOnly{
    OrderStatus getOrderStatus();
    DeliveryStatus getDeliveryStatus();
}
```

```java
public interface OrderRepository extends JPARepository<Order,Long>{
    List<ODStatusOnly> getInfoOrderStatus(@Param("orderStatus") OrderStatus orderStatus);
}
```

기존의 Data JPA를 사용할때처럼 조회 반환값에 Generic을 넣어 반환시키는것이 아닌, Custom한 Interface를 만들어서 사용하면 된다.



###### 예제 코드

```java
@Test
    public void 클라이언트에게_BODY_전달받은_경우(){
        //given
        String email="seonghoo1217@naver.com";

        //when 주어진 LocalDate 기준이상의 값 컬럼 조회
        List<MemberProjection> memberCommitInfo = memberRepository.findByEmail(email);
        memberCommitInfo.forEach(
                r-> {
                    System.out.println("Name="+r.getName());
                    System.out.println("Last Commit Date="+r.getCommitTime());
                }
        );
    }
```

이때 Fetch된 Result는 **Entity Object**가 아닌 JPA가 생성한 **Proxy 객체**이다.

 

즉, 개발자가 인터페이스에 정의를 해놓는다면 **Projection**을 통해 간단하게 **JPA가 구현체를 만들어 전달**한다.

NativeQuery를 작성할 필요성이 사라진 것이다.



##### Projection - 인터페이스 기반 Open Projection

###### 예시 코드

```java
//ODStatusOnly

public interface ODStatusOnly{
    @Value("#{target.orderTime+' '+target.orderUser}")
    OrderStatus getOrderStatus();
	  // 위 처럼 작성하면, orderTime과 orderUser가 문자열로 "yyyy-mm-dd 오현우" 이런식으로 나온다는 말!
}

```

위와같이 **Open Projection** 방법을 사용할 경우 반환 객체의 필드값을 하나의 문자열(SpEL과 유사)로 리턴받는다.

 

하지만, 해당 방식의 경우 결국 `**Entity**`의 모든 컬럼 값을 조회한 후 지정한 데이터를 문자열로 뿌려주는 것이다.

즉, JPQL Select **최적화를 목표**로 하고 사용하는 **Projection의 의의**에서 이점을 얻을 수 없다.



##### Open Projection의 단점

결국 내부적으로는 해당 엔티티의 모든 컬럼을 조회한다. 

사용 이유가 거의 없음. 



##### Projection - 클래스 기반의 Projection

###### 예시 코드

```java
@Getter
public class ODStatusOnly{
    private OrderStatus orderStatus;
    private DeliveryStatus deliveryStatus;

    public ODStatusOnly odStatusOnly(OrderStatus orderStatus,DeliveryStatus deliveryStatus){
        this.orderStatus=orderStatus;
        this.deliveryStatus=deliveryStatus;
    }
}
```

클래스 기반일때 봐야할것은 `Constructor(생성자)` 이다.

클래스 기반으로 Projection을 구성할 경우 JPA는 Constructor의 파라미터 명을 기반으로 최적화를 시도한다.

이 때, 필드 값과 다른 이름일 경우 `IllegalStateException`을 throw 하게 된다. (ContextLoader가 이를 찾을 수 없기 때문)

```java
public interface OrderRepository extends JPARepository<Order,Long>{
    List<ODStatusOnly> findClassProjectionByOrderStatus(@Param("orderStatus") OrderStatus orderStatus);
}
```



##### 내가 평소 하던 실수!!

```java
List<Order> orders = orderRepository.findAll(); // 모든 필드 SELECT

List<OrderResponseDTO> result = orders.stream()
    .map(order -> new OrderResponseDTO(order.getOrderStatus(), order.getDeliveryStatus()))
    .collect(Collectors.toList());
```

ResponseDTO를 따로 제작하지만 결국 Order를 전체 조회후에 map을 통해 필요한 정보들을 모았다. 

이러면 쿼리상 어마어마한 손해가 있었다!! 성능이 어마어마하게 저하됐음...

```java
@Query("SELECT new com.example.dto.OrderResponseDTO(o.orderStatus, o.deliveryStatus) FROM Order o")
List<OrderResponseDTO> findOrderStatuses();

List<OrderResponseDTO> findByOrderStatus(OrderStatus status);
```

처음부터 이렇게 ResponseDTO로 받게되면 특정 Column만 조회하므로 성능이 많이 개선될수있다!!



##### 동적 Projection

```java
public interface OrderRepository extends JPARepository<Order,Long>{
    <T>List<T> findGenericProjectionByOrderStatus(@Param("orderStatus") OrderStatus orderStatus,Class <T> type);
}
```

제네릭을 사용하면, 동적으로 Projection의 데이터를 변경할 수 있다.

```java
orderRepository.findGenericProjectionByOrderStatus(orderStatus,OSOnlyDTO.class );
```



잘 이해가 안되어서 예시를 찾아보았다. 

만약에 주문 리스트 조회가 두가지(주문 요약, 주문 상세) 조회가 있다고 가정해보자. 

일반적으로는

```java
List<OrderSummaryDTO> findOrderSummaryByOrderStatus(OrderStatus status);
List<OrderDetailDTO> findOrderDetailByOrderStatus(OrderStatus status);
```

이렇게 두개를 따로 만드는데,

**동적 Projection**으로 만들게되면

```java
public interface OrderRepository extends JpaRepository<Order, Long> {
    <T> List<T> findByOrderStatus(OrderStatus orderStatus, Class<T> type);
}
```

이렇게 간단해진다! 



###### DTO 예시

```java
// 요약용 DTO
public class OrderSummaryDTO {
    private OrderStatus orderStatus;
    private LocalDateTime orderDate;

    public OrderSummaryDTO(OrderStatus orderStatus, LocalDateTime orderDate) {
        this.orderStatus = orderStatus;
        this.orderDate = orderDate;
    }
}

// 상세용 DTO
public class OrderDetailDTO {
    private Long orderId;
    private OrderStatus orderStatus;
    private LocalDateTime orderDate;
    private String userName;
    private DeliveryStatus deliveryStatus;

    public OrderDetailDTO(Long orderId, OrderStatus orderStatus, LocalDateTime orderDate, String userName, DeliveryStatus deliveryStatus) {
        this.orderId = orderId;
        this.orderStatus = orderStatus;
        this.orderDate = orderDate;
        this.userName = userName;
        this.deliveryStatus = deliveryStatus;
    }
}
```



###### 실제 사용 예시 

```java
// Controller or Service
public List<?> getOrders(String viewType) {
    if (viewType.equals("summary")) {
        return orderRepository.findByOrderStatus(OrderStatus.DELIVERED, OrderSummaryDTO.class);
    } else if (viewType.equals("detail")) {
        return orderRepository.findByOrderStatus(OrderStatus.DELIVERED, OrderDetailDTO.class);
    } else {
        throw new IllegalArgumentException("Unknown view type");
    }
}
```

이렇게 한개의 api로 두개의 조회를 모두 할수있다.

하지만 Generic을 사용했을때의 단점은 없을까?

###### 동적 Projection의 단점

1. 타입 안정성 부족

   - 제네릭 타입을 런타임에 넘기다 보니, 컴파일 시점에서 타입 오류를 잡을 수 없다.
   - 필드명이나 생성자 파라미터 명이 다르면 Exception이 뜬다.

2. 내부 구조를 확인할 수 없어서 리팩토링이 불가능하다.

   ```java
   var result = orderRepository.findByOrderStatus(orderStatus, OrderSummaryDTO.class);
   result.get(0). // ← 이 시점에서 IDE는 어떤 필드가 있는지 모름
   ```

3. 쿼리 분석의 어려움

   - 런타임에 어떤 Projection이 사용 될지 알수 없어서 쿼리 로깅이나 디버깅 시 어떤 SELECT가 수행되는지 직관적으로 확인이 어렵다.



동적 Projection 사용 추천 상황

- 간단한 리스트 API 에서 여러 화면이 같은 조건으로 다르게 보여줘야할때
- 여러 DTO로 재사용성이 높을때