---
layout: post
title:  "Java Spring Lombok 어노테이션 정리"
categories: Article
---

# Java Spring Lombok 어노테이션 정리



### 1. Getter, Setter

##### 장점 

- **간결한 코드** : 직접 Getter, Setter를 사용하지 않아도 된다.
- **부분 적용 가능** : 필드 단위로 @Getter, @Setter 를 붙힐 수 있어서 불필요한 접근을 막을 수 있다.
- **IDE의 자동 완성 부담 감소** : 반복적인 메서드 작성이 줄어든다.

##### 단점

- **캡슐화 약화** : 모든 필드에 Getter/Setter를 남발하면 객체지향 적인 캡슐화 원칙이 깨질 수 있음.
- **의도하지 않은 값 변경 위험** : Setter를 통해 외부에서 마음대로 값을 바꾸는 일이 생길 수 있음.



### 2. Data(Getter + Setter + EqualsAndHashCode + ToString + RequiredArgsConstructor)

##### 장점 

- **모든 보일러플레이트 제거** : 데이터 객체에 자주 쓰는 메서드를 자동으로 만들어줘서 간편함.
- **DTO 등 단순 데이터 전달용 객체에 적합** : 기능보다 데이터 보관이 목적일 경우 적합.

##### 단점 

- **원치 않는 메서드까지 생성될 수 있음**: 예를 들어 `equals()`, `hashCode()`가 자동 생성되면서 객체 비교 로직이 의도와 다를 수 있음.
- **민감 정보 노출 위험**: `toString()`이 자동 생성되면서 패스워드 같은 민감 정보가 로그에 찍힐 수도 있음.
- **무분별한 사용 지양**: 복잡한 비즈니스 로직이 들어가는 객체에서는 제어가 어려워질 수 있음.

### 3. Builder

##### 장점

- **가독성 좋은 객체 생성**: 필드가 많을 때 생성자보다 훨씬 가독성이 좋음.
  ```java
  Member member = Member.builder()
                        .id(1L)
                        .name("Hyunwoo")
                        .email("hyunwoo@email.com")
                        .build();
  ```
- **불변 객체(Immutable Object)에 적합**: `final` 필드를 쓰고 `@Builder`와 함께 사용하면 객체 생성 후 값을 바꿀 수 없게 할 수 있음.
- **필드 순서에 상관없이 값 주입 가능**: 생성자에서는 순서를 지켜야 하는데, 빌더는 그런 걱정이 없음.

##### 단점

- **런타임 오류 위험**: 필수 필드 누락을 컴파일 타임에 잡지 못함.
- **생성 성능 저하**: Builder 객체를 만들고, 다시 해당 객체를 생성하기 때문에 약간의 오버헤드가 있음.
- **가독성 저하 (짧은 객체엔 오히려 과함)**: 필드가 몇 개 없는데도 빌더를 사용하면 오히려 복잡해 보일 수 있음.



### 추천 하는 사용 패턴 

**DTO / VO** → `@Data` 또는 `@Getter`만 쓰고 `@Setter`는 지양

**Entity** → `@Getter`만 쓰고, `@Setter`는 필요한 메서드에만 붙임

**생성자 많고 필드 많은 객체 생성** → `@Builder` + `@AllArgsConstructor` 또는 정적 팩토리 메서드 방식